import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Subject, from, Subscription, interval } from 'rxjs';
import { Accountant } from './accountant';

interface Status {
  id: string,
  name: string,
  status: string,
  args: any,
  time: number,
  restartCounter: number
}

const MAX_REQUEST = 50;
const PROCESSING_STATUS = ["Sending", "Check session", "Logging", "Getting Data"];

@Injectable({
  providedIn: 'root'
})
export class MemberFetcher {
  private notifier = new Subject();
  private statusList: Map<string, Status> = new Map();
  private fromDate: string = "";
  private toDate: string = "";
  private memberName: string = "";
  private requestBuffer = [];

  // check status job
  private subscription: Subscription;
  private checkStatusJob = interval(10000);

  constructor(private apiService: ApiService) {
    this.apiService.reportMsgEvent.subscribe(message => {
      let jsonString = JSON.parse(JSON.stringify(message));
      let msg = message;
      switch (jsonString.type) {
        case "reject":
        case "notify": {
          this.changeStatus(jsonString.uuid, jsonString.data);
          break;
        }
        case "resolve": {
          this.parseScanData(message);
          break;
        }
      }
    });

    // this job will validate and re-scan the member when it waited more than 10s
    this.subscription = this.checkStatusJob.subscribe(val => {
      const processingStatus: Set<string> = new Set(PROCESSING_STATUS);
      let stopIDs: Set<string> = new Set();
      let now = Date.now() / 1000;
      let counter = 0;
      let currentProcessing = this.countProcessing();

      // Check to restart the request if it's hang
      this.statusList.forEach((value, key) => {
        let waitingTime = (value.restartCounter + 1) * 30;
        if (processingStatus.has(value.status) && now > value.time + waitingTime) {
          // Cause many request have the same id, so just call stopping 1 time
          if (!stopIDs.has(value.id)) {
            this.stopRequest(value);
            stopIDs.add(value.id);
          }
          value.restartCounter++;
          this.requestBuffer.push(value);
          this.statusList.delete(key);
          counter++;
          console.log('Restarting ' + value.name + ' for waiting more than ' + waitingTime + ' seconds...')
        }
      });

      // Check buffer
      while (currentProcessing < MAX_REQUEST && this.requestBuffer.length > 0) {
        let status = this.requestBuffer.shift();
        this.send(status.id, status.name, status.args, status.restartCounter);
        currentProcessing++;
      }

      if (counter > 0 || this.requestBuffer.length > 0) {
        console.log('Restarted ' + counter + ' of ' + this.statusList.size + ' - Buffer length: ' + this.requestBuffer.length);
      }
    });
  }

  scan(fromDate, toDate, superList, memberName, notifier) {
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.notifier = notifier;
    this.statusList.clear();
    this.requestBuffer = [];
    this.memberName = memberName;
    superList.forEach(s => {
      let args = [{
        "id": s.id,
        "from_date": this.fromDate,
        "to_date": this.toDate,
        "more_post": { "login_name": window.sessionStorage.getItem('username') }
      }];
      if (s.id && s.name) {
        this.send(s.id, s.name, args, 0);
      }
    })
  }

  changeStatus(uuid, data) {
    if (this.statusList.has(uuid)) {
      let status = this.statusList.get(uuid);
      let notifyData = {
        type: "notify",
        data: {}
      };
      if (data.message != undefined) {
        status.status = JSON.parse(JSON.stringify(data)).message;
        status.time = (Date.now() / 1000);
        this.statusList.set(uuid, status);
        // notify to the subcriber
        notifyData.data = status;
        this.notifier.next(notifyData);
      }
    }
  }

  /* Decide to keep scanning continous or not base on the child list
    if the child list is larger or equal to 3, it means we have the member data, don't need to keep scanning
 */
  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message)).data;
    let childList = this.getChildList(message.uuid, data);
    let notifyData = {
      type: "resolve",
      data: {}
    };

    if (!this.statusList.has(message.uuid)) {
      return;
    }

    if (childList.length < 3) {
      this.getChildren(message.uuid, data).forEach(acc => {
        // scan for this element
        let get_child_list: { [x: string]: any } = {};
        let args = [{
          "id": data.id,
          "from_date": this.fromDate,
          "to_date": this.toDate,
          "more_post": {}
        }];
        let more_post = {
          "login_name": window.sessionStorage.getItem('username'),
          "get_child_list": {}
        };
        get_child_list[acc.name.toLowerCase()] = true;
        childList.forEach(c => {
          get_child_list[c] = true;
        });
        more_post.get_child_list = get_child_list;
        args[0].more_post = more_post;

        if (acc.id && acc.name) {
          this.send(acc.id, acc.name, args, 0);
        }
      });
    } else {
      notifyData.data = message;
      this.notifier.next(notifyData);
    }

    // remove from status list
    if (this.statusList.has(message.uuid)) {
      let name = this.statusList.get(message.uuid).name.toUpperCase();
      this.statusList.forEach((value, key) => {
        if (value.name.toUpperCase() == name) {
          this.statusList.delete(key);
        }
      });
      notifyData.type = "delete";
      notifyData.data['name'] = name;
      this.notifier.next(notifyData);
    }
  }

  getChildren(uuid, data): Accountant[] {
    let result: Accountant[] = [];
    let childList: string[] = this.getChildList(uuid, data);
    let index = childList.length - 1;
    data.accountant.forEach(account => {
      if (account.username.toLowerCase() == childList[index].toLowerCase()) {
        let loop = account.child;
        // continue with its child
        while (index > 0) {
          let tmp = loop;
          index--;
          tmp.forEach(e => {
            if (e.username.toLowerCase() == childList[index].toLowerCase()) {
              loop = e.child;
            }
          });
        }
        if (loop) {
          loop.forEach(e => {
            let account: Accountant = new Accountant(data.id, e);
            if (this.isContinue(account)) {
              console.log("AAAAAAAAAAAAA");
              result.push(account);
            }
          });
        }
      }
    });

    return result;
  }

  isContinue(acc: Accountant) {
    if (!this.memberName || !acc.reportAccountant || (acc.reportAccountant && acc.reportAccountant.length == 0)
        || this.hasMemberReport(acc.reportAccountant)) {
      return true;
    }
    return false;
  }

  hasMemberReport(reports) {
    let ret: boolean = false;
    console.log(reports);
    for (const report of reports) {
    // reports.forEach(report => {
      if (report.resultList) {
        if (report.resultList.length == 0) {
          ret = true;
        }
        for (const result of report.resultList) {
        // report.resultList.forEach(result => {
          if (result.memberName && result.memberName.toLowerCase() == this.memberName) {
            console.log("CCCCCCCCCC");
            ret = true;
          }
        }
      }
    }
    
    if (ret) {
      console.log("BBBBBBBBB");
    }
    return ret;
  }

  getChildList(uuid, data): string[] {
    let childList: string[] = [];

    if (data.more_post.get_child_list) {
      Object.keys(data.more_post.get_child_list).forEach(element => {
        childList.push(element);
      });
    } else {
      if (this.statusList.get(uuid)) {
        childList.push(this.statusList.get(uuid).name);
      }
    }

    return childList;
  }

  send(id, name, args, restartCounter) {
    let status = { id: id, name: name, status: "Sending", args: args, time: (Date.now() / 1000), restartCounter: restartCounter };
    let notifyData = {
      type: "notify",
      data: status
    };

    if (this.countProcessing() < MAX_REQUEST) {
      let uuid = this.apiService.sendSocketEvent('scan', args, true);
      this.statusList.set(uuid, status);
      this.notifier.next(notifyData);
    } else {
      this.requestBuffer.push(status);
    }
  }

  stopRequest(req: Status) {
    let args = [{ "id": req.id }];
    this.apiService.sendSocketEvent('stop', args, true);
  }

  countProcessing() {
    const processingStatus: Set<string> = new Set(PROCESSING_STATUS);
    let result = 0;
    this.statusList.forEach(status => {
      if (processingStatus.has(status.status)) {
        result++;
      }
    });
    return result;
  }
}