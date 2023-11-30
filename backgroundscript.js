/** 
 * Copyright (C) Growbot 2016-2023 - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Growbot <growbotautomator@gmail.com>, 2016-2023
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.updatewanted && request.updatewanted == true) {
        gblIgBotUser.init();
    }

    if (request.guidCookie) {
        gblIgBotUser.overrideGuid(request.guidCookie);
    }

    if (request.ftOver == "true") {
        gblIgBotUser.overrideFT();
    }


    if (request.ig_user) {
        gblIgBotUser.ig_users.push(request.ig_user);
        gblIgBotUser.ig_users = uniq(gblIgBotUser.ig_users);
        gblIgBotUser.current_ig_username = request.ig_user.username;

        if (request.ig_user_account_stats) {
            gblIgBotUser.account_growth_stats.push(request.ig_user_account_stats);
            gblIgBotUser.account_growth_stats = uniq(gblIgBotUser.account_growth_stats);
        }

        checkInstallDate();

        gblIgBotUser.saveToLocal();
        gblIgBotUser.saveToServer();
    }

    if (request.fnc == 'openBuyScreen') {
        openBuyScreen();
    }

    sendResponse();

});

var gblIgBotUser = {
    user_guid: undefined,
    install_date: new Date().toUTCString(),
    instabot_install_date: undefined,
    ig_users: [],
    licenses: {},
    actions: [
        { date: '', action: '' }
    ],
    account_growth_stats: [],
    options: {},
    //      whitelist: [],
    //      savedQueue: [{ name: 'q1',date:datetime,queue:[]},{ name: 'q1',date:datetime,queue:[]}]
    init: async function() {

        runWinVarsScript();

        this.user_guid = await this.getPref('growbot_user_guid');

        if (!this.user_guid || this.user_guid == false) {
            this.user_guid = this.uuidGenerator();
            this.setPref('growbot_user_guid', this.user_guid);
        }

        //checkInstallDate();

    },
    overrideGuid: function(newGuid) {
        this.user_guid = newGuid;
        this.setPref('growbot_user_guid', this.user_guid);
    },
    overrideFT: function() {
        this.instabot_free_trial_time = 0;
        openBuyScreen();
    },
    uuidGenerator: function() {
        var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    getPref: async function(name) {
        return new Promise(function(resolve) {
            chrome.storage.local.get(name, function(value) {
                if (Object.keys(value).length > 0) {
                    resolve(value[name]);
                } else {
                    resolve(false);
                }
            });
        });
    },
    setPref: async function(name, value) {
        chrome.storage.local.set({
            [name]: value
        }, function() {});
    },
    saveToLocal: function() {
        chrome.storage.local.set({ 'igBotUser': JSON.stringify(gblIgBotUser) }, function() {});
    },
    saveToServer: function() {
        for (var i = 0; i < this.ig_users.length; i++) {
            fetch("https://www.growbotforfollowers.com/igBotUser/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'user_guid': this.user_guid, 'ig_username': this.current_ig_username, 'install_date': this.install_date, 'instabot_install_date': this.instabot_install_date })
            });
        }
    }
};


var instabot_free_trial_time = 259200000; // 129600000 = 36 hours, 259200000 = 72 hours, 604800000=7 days, 1296000000 = 14 days, 2592000000 = 30 days
var first_run = false;
var todaysdate = new Date();
var today = todaysdate.getTime();
var timeSinceInstall;

chrome.runtime.onInstalled.addListener(installedOrUpdated);

chrome.action.onClicked.addListener(function(tab) {
    chrome.tabs.query({ url: ["https://www.instagram.com/", "https://www.instagram.com/*"], currentWindow: true }, tabs => {
        if (tabs.length === 0) {
            chrome.tabs.create({ url: 'https://www.instagram.com/' }, function(tab) {
                chrome.tabs.sendMessage(tab.id, { "openGrowbot": true, igBotUser: gblIgBotUser });
            });
        } else {
            var toggled = false;
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].active === true) {
                    toggled = true;
                    chrome.tabs.sendMessage(tabs[i].id, { "toggleGrowbot": true, igBotUser: gblIgBotUser });
                }
            }
            if (toggled === false) {
                // only runs if instagram wasn't the active tab:
                chrome.tabs.update(tabs[0].id, { active: true });
                chrome.tabs.sendMessage(tabs[0].id, { "openGrowbot": true, igBotUser: gblIgBotUser });
            }
        }
    });
});


//kickoff
//gblIgBotUser.init();

function installedOrUpdated() {
    gblIgBotUser.init();
}

function runWinVarsScript() {
    chrome.tabs.query({ url: ["https://www.instagram.com/*", "https://www.instagram.com/"] }, tabs => {
        for (var i = 0; i < tabs.length; i++) {
            var igTabId = tabs[i].id;
            chrome.scripting.executeScript({
                    target: { tabId: igTabId },
                    files: ['winvars.js'],
                    world: 'MAIN'
                },
                function() {});
        }
    });
}


async function checkInstallDate() {

    var installDate = await gblIgBotUser.getPref('instabot_install_date');

    if (installDate == false) {
        first_run = true;
        installDate = '' + today;
        gblIgBotUser.setPref('instabot_install_date', installDate);
    }

    gblIgBotUser.instabot_install_date = installDate;

    // string -> int -> date -> UTCString for python
    gblIgBotUser.install_date = new Date(+installDate).toUTCString();
    timeSinceInstall = today - installDate;
    checkLicenseOnServer();

}

function sendMessageToInstagramTabs(message) {
    chrome.tabs.query({ url: ["https://www.instagram.com/", "https://www.instagram.com/*", "https://www.growbotforfollowers.com/*"] }, function(tabs) {
        //if (tabs.length == 0) return false;
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, message).then(response => {
                // console.log("Message from the content script:");
                // console.log(response.response);
            }).catch(function() {
                // console.log('error when: ' + message);
                // console.log(message);
            });
        }
    });
}


function onError(error) {
    //console.error(`Error: ${error}`);
}

function checkLicenseOnServer() {
    var url = 'https://www.growbotforfollowers.com/check_subscription.php?guid=' + gblIgBotUser.user_guid + '&ign=' + btoa(gblIgBotUser.current_ig_username);
    console.log(url);
    fetch(url, {
            method: 'GET'
        })
        .then(response => response.text())
        .then(function(data) {
            console.log(data);

            if (parseInt(data) == 1) {
                allLicensesFetched(1, { "growbot_license": 1 });
            } else if (parseInt(data) == 2) {
                allLicensesFetched(2, {});
            } else {
                allLicensesFetched(0, {});
            }

        });
}

function allLicensesFetched(count, licenses) {
    if (count === 1) {
        // console.log('no license, app in free trial');
        sendMessageToInstagramTabs({ "instabot_install_date": gblIgBotUser.instabot_install_date, "instabot_free_trial_time": instabot_free_trial_time, "instabot_has_license": false, igBotUser: gblIgBotUser });
    } 
     else if (count === 2) {
        // console.log('has license');
        sendMessageToInstagramTabs({ "instabot_install_date": gblIgBotUser.instabot_install_date, "instabot_free_trial_time": instabot_free_trial_time, "instabot_has_license": true, igBotUser: gblIgBotUser });
    } else if (count === 0) {
        // console.log('no license,  free trial ENDED');
        openBuyScreen();
    } else {
        openBuyScreen();
    }

    gblIgBotUser.licenses = licenses;

    gblIgBotUser.saveToLocal();
}


function openBuyScreen() {
    //console.log(gblIgBotUser);
    sendMessageToInstagramTabs({ "openBuyScreen": true, igBotUser: gblIgBotUser, "instabot_free_trial_time": instabot_free_trial_time });
}


function uniq(ar) {
    return Array.from(new Set(ar.map(JSON.stringify))).map(JSON.parse);
}