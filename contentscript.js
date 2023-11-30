/** 
 * Copyright (C) Growbot 2016-2023 - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Growbot <growbotautomator@gmail.com>, 2016-2023
 */

var guidCookie = localStorage['gbUserGuid'];
var urlAcctInfo = 'https://www.instagram.com/';
var urlAcctInfo2 = 'https://i.instagram.com/api/v1/users/web_profile_info/?username=';

/*

SAVE USERNAME AND IP TO METADATA WHEN LOADING SUBSCRIPTION

load list of usernames -> turn to queue

Button hover states

- FILTERS
    connected_fb_page
    has_channel
    business_category_name
    highlight_reel_count
    last post date** - handle private accounts
    first post date**
    average posts per day?

- option to block client events

1) auto like when people comment your images
2) auto reply to comments (not sure if this is a must have feature tho).

make tour
video tour?  ttsreader.com

Add Google analytics

auto unfollow
schedule unfollowing
    - background page messaging

progress bars!
https://loading.io/progress/
https://kimmobrunfeldt.github.io/progressbar.js/

<meter
  min="0"
  max="100"
  low="25"
  high="75"
  optimum="80"
  value="50"
></meter>

-make it remember the "after" when loading accounts"

6) Could you integrate a location based filtering system? For an example google coordinate paste + radius

button to clear already attempted or load as queue

Make quick "Unlike" or make sure to show user info for each pic.

Anyway you can randomize the post likes
My guess IG would spot you liking 1 post on every follow.
It would be nice if you could randomize likes and randomize frequency on this option.
For example every 3 to 10 (Random) follows like (1-5 posts) Random.

https://stackoverflow.com/questions/16758316/where-do-i-find-the-instagram-media-id-of-a-image

BUGS:
 when i have lets say 100 people in queue and im getting additional data
 after completion i will get them sorted by followers ratio. Bug is - that pictures will dissappear and if i will select
 people from there i cant add them to whitelist or do anything with them. 
*/

// var growbotAction = {
//     type: '', //[like,follow,unfollow,block,removefollower,]
//     account: {},
//     scheduled_time: 'datetime',
//     media: {},
//     complete: false
// }

const igExternalVars = {
    "emptyProfilePicUrl": "44884218_345707102882519_2446069589734326272_n",
    "qsForConvenienceButtons": "._aacl._aaco._aacw._aacx._aad6._aade"
}

var gblAcctsQueueGrid;
var gblCheckboxPlugin;

var instabot_install_date = 0; // set from background page
var instabot_free_trial_time = 0; // set from background page
var instabot_has_license = false;

var defaultFilterOptions = {
    applyFiltersAutomatically: true,
    followers: [0, 10000000],
    following: [0, 10000],
    followRatio: [-10000, 10000000],
    mutualFollowedBy: [0, 10000000],
    posts: [0, 10000],
    lastPosted: [0, 5000],
    private: true,
    non_private: true,
    verified: true,
    non_verified: true,
    follows_me: false,
    non_follows_me: true,
    followed_by_me: false,
    non_followed_by_me: true,
    external_url_contains: false,
    external_url_not_contains: false,
    external_url_contains_text: '',
    external_url_not_contains_text: '',
    is_business_account: true,
    non_is_business_account: true,
    is_joined_recently: true,
    non_is_joined_recently: true,
    connected_fb_page: true,
    non_connected_fb_page: true,
    bio_contains: false,
    bio_not_contains: false,
    bio_contains_text: '',
    bio_not_contains_text: '',
    no_profile_pic: true,
    profile_pic: true,
    business_category_name_contains: false,
    business_category_name_contains_text: '',
    business_category_name_not_contains: false,
    business_category_name_not_contains_text: ''
};
var defaultOptions = {
    timeDelay: 180000,
    timeDelayAfterSoftRateLimit: 600000,
    timeDelayAfterHardRateLimit: 3600000,
    timeDelayAfter429RateLimit: 60000,
    timeDelayAfterAdditionalInfo: 2000,
    useTimeDelayAfterAdditionalInfo: false,
    timeDelayAfterSkip: 0.5,
    useRandomTimeDelay: true,
    percentRandomTimeDelay: 0.5,
    followPrivateAccounts: true,
    limitQueue: true,
    maxAcctQueueLength: 50,
    paginationLimit: 100,
    truncateStart: 0,
    dontUnFollowFollowers: true,
    dontUnFollowFilters: false,
    dontRemoveOrBlockFilters: false,
    dontUnFollowNonGrowbot: true,
    unFollowFresh: false,
    unFollowIfOld: true,
    unFollowDelay: 259200000, // 259200000 = 3 days
    unFollowIfOlderThan: 2592000000, // 2592000000 = 30 days
    followLikeLatestPics: false,
    numberFollowLikeLatestPics: 1,
    filterOptions: defaultFilterOptions,
    ui: [],
    showUnfollowingInQueue: true,
    showFollowingInQueue: true,
    showLikesInQueue: true,
    removeAccountsFromQueue: false,
    autoSaveQueue: false,
    showStamps: true,
    showProfilePicInQueue: true,
    showConvenienceButtons: true,
    loadQueueOnStartup: false,
    clickNotNow: false,
    followPeopleAlreadyAttempted: false,
    maxPerEnabled: false,
    maxPerActions: 50,
    maxPerPeriod: 86400000
};

var gblOptions = defaultOptions;

var gbl404attempt = 0;

var acctsQueue = [];
var theirFollowings = [];
var myFollowers = [];
var timeoutsQueue = [];

var acctsProcessed = [];
var acctsPreviouslyAttempted = [];
var acctsWhiteList = [];
var freeTrialInterval;

var scrollIntervalId;
var totalAvailableForQueue;

var loadedTheirFollowers = false;
var loadedTheirFollowings = false;
var loadedMyFollowers = false;
var loadedMyFollowings = false;

var user;
var currentProfilePage = false;

var todaysdate = new Date();
var today = todaysdate.getTime();

var mediaToLike = [];
var previousLikes = [];

var currentList = false;

var queueSplit = false;

var usernameCheckInterval;

var maxActionsDelayStartTime = 0;
var actionsTaken = 0;

let mediaForComments = [];
let accountIdsThatCommented = [];


let mediaForLikes = [];
let accountIdsThatLiked = [];

function waitForWinVars() {
    //console.log(localStorage.getItem('winvars'));

    var igloggedinacct = JSON.parse(localStorage.getItem('winvars'));
    if (igloggedinacct && igloggedinacct.config && igloggedinacct.config.viewer != null) {
        user = igloggedinacct.config;

        localStorage.clear('winvars');

        injectControlsDiv();

        startUserNameFreshnessInterval();

        setInterval(monitorButtonConditions, 100);

        getBackgroundInfo();

    } else {
        setTimeout(waitForWinVars, 10);
    }

}

function displayFreeTrialTimeLeft() {
    var datenow = new Date();
    var timenow = datenow.getTime();

    if (timenow - instabot_install_date < instabot_free_trial_time && instabot_has_license == false) {
        var timeLeft = millisecondsToHumanReadable(instabot_free_trial_time - (timenow - instabot_install_date), true);
        $('#h2FreeTrialTimeLeft').show().html(timeLeft + ' left in trial. <a href="" id="linkBuyNow">Subscribe Now</a>');
        $('#linkBuyNow').click(function(e) {
            e.preventDefault();
            chrome.runtime.sendMessage({
                "fnc": "openBuyScreen"
            });
            setTimeout(function() {
                // bad practice hack to clear ending the free trial if someone clicks the link
                localStorage.removeItem('gbFTover');
            }, 3000);
            return false;
        });
    } else if (instabot_has_license == true) {
        $('#h2FreeTrialTimeLeft').text('Thank you for being a subscriber!');
        $('#relinkSubscription').hide();
        clearInterval(freeTrialInterval);
    } else {
        $('#h2FreeTrialTimeLeft').hide();
        clearInterval(freeTrialInterval);
    }
}

function timeToDate(t) {
    var date = new Date(parseInt(t));
    return date.toString();
}

function printMessage(txt) {
    outputMessage(txt);
}

function outputMessage(txt) {

    var statusDiv = document.getElementById('igBotStatusDiv');
    var fakeConsole = document.getElementById('txtConsole');

    if (txt.trim() != '') {
        txt = getTimeStamp() + ' - ' + txt;
        statusDiv.textContent = txt;
        displayWaitTimeHacky();
    }

    chrome.storage.local.set({
        growbotLog: '' + fakeConsole.textContent + '\n' + txt
    }, function() {});

    fakeConsole.textContent = fakeConsole.textContent + '\n' + txt;

    if (document.activeElement.id !== 'txtConsole') {
        fakeConsole.scrollTop = fakeConsole.scrollHeight;
    }

    includeLogInMailToLinks();

}

function includeLogInMailToLinks() {
    $('.growbotEmailLink').attr('target', '_blank').attr('href', 'mailto:growbotautomator@gmail.com?body=' + encodeURIComponent('\n\n------------------------------------------------------------------------------------------------------------------------------------\nPlease type your message above this line, include the log below for debugging:\n------------------------------------------------------------------------------------------------------------------------------------\n' + document.getElementById('txtConsole').textContent.slice(-20000)));
}


function displayWaitTimeHacky() {
    var statusDiv = document.getElementById('igBotStatusDiv');

    var statusText = statusDiv.textContent;

    if (statusText.indexOf('Max actions exceeded') > -1) {
        statusDiv.textContent = getTimeStamp() + ' - ' + 'Max actions exceeded, waiting ' + millisecondsToHumanReadable(maxActionsDelayRemaining(), true)
        setTimeout(displayWaitTimeHacky, 1000);
        return false;
    }

    if (statusText.indexOf('waiting ') > -1 && statusText.indexOf(' seconds') > -1) {
        var secondsStart = statusText.indexOf('waiting ') + 8;
        var secondsEnd = statusText.indexOf(' second');
        var seconds = statusText.substring(secondsStart, secondsEnd);

        if (!isNaN(seconds) && (seconds - 1 > 0)) {
            statusDiv.textContent = statusDiv.textContent.replace('waiting ' + seconds + ' seconds', 'waiting ' + (Math.round((seconds - 1) * 100) / 100) + ' seconds');
            if (seconds - 1 > 1) {
                setTimeout(displayWaitTimeHacky, 1000);
            }
        }
    }

    if (statusText.indexOf('waiting ') > -1 && statusText.indexOf(' minute') > -1) {
        var secondsStart = statusText.indexOf('waiting ') + 8;
        var secondsEnd = statusText.indexOf(' minute');
        var minutes = statusText.substring(secondsStart, secondsEnd);

        if (!isNaN(minutes)) {
            seconds = minutes * 60;
            statusDiv.textContent = statusDiv.textContent.replace('waiting ' + minutes + ' minutes', 'waiting ' + (Math.round((seconds - 1) * 100) / 100) + ' seconds');
            if (seconds - 1 > 1) {
                setTimeout(displayWaitTimeHacky, 1000);
            }
        }
    }

}

function millisecondsToHumanReadable(ms, formatAsString) {

    var obj = {};
    var x = ms / 1000;
    obj.seconds = parseInt(x % 60);
    x /= 60;
    obj.minutes = parseInt(x % 60);
    x /= 60;
    obj.hours = parseInt(x % 24);
    x /= 24;
    obj.days = parseInt(x);

    if (formatAsString == false) {
        return obj;
    }

    return obj.days + ' days, ' + obj.hours + ' hours, ' + obj.minutes + ' minutes, ' + obj.seconds + ' seconds';

}

function zeroPad(digitcount, num) {
    for (var i = 0; i < digitcount; i++) {
        num = "0" + num;
    }

    return num.substr(-digitcount, digitcount);
}

function getTimeStamp() {
    var d = new Date();
    var meridium = '';
    var hours = d.getHours();

    // if (hours > 11) {
    //     meridium = ' pm';
    //     hours = hours - 12;
    // } else {
    //     meridium = ' am';
    // }

    // if (hours == 0) {
    //     meridium = ' pm';
    //     hours = 12;
    // }

    return (d.getFullYear() + '-' + zeroPad(2, d.getMonth() + 1)) + '-' + zeroPad(2, d.getDate()) + ' ' + zeroPad(2, d.getHours()) + ':' + zeroPad(2, d.getMinutes()) + ':' + zeroPad(2, d.getSeconds()) + meridium;
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].id === obj.id) {
            return true;
        }
    }

    return false;
}

function findAcctById(id, list, returnIndexOnly) {
    if (returnIndexOnly !== true) returnIndexOnly = false;
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            if (returnIndexOnly === true) return i;
            return list[i];
        }
    }
    return false;
}


function addNewConvenienceLinks(element) {

    if (gblOptions.showConvenienceButtons == false) return false;

    var $$this = $(element);

    if ($$this.children('div').length > 0) return false;
    if ($$this.parents('.Mr508').length > 0) return false;
    if ($$this.parents('.XQXOT').length > 0) return false;

    var username = $$this.text();

    $$this.after('<a class="igBotInjectedLinkWhitelist" href="javascript:void(0);" data-username="' + username + '">Whitelist</a> <a class="igBotInjectedLinkUnfollow" href="javascript:void(0);" data-username="' + username + '">Unfollow</a>');
    $$this.parents('.RqtMr').css({
        'max-width': 'initial'
    });

}


async function convenienceLinkUnfollowAcct(userName) {
    var acct = await getAdditionalDataForAcct({
        username: userName
    });
    quickUnfollowAcct(acct);
}

async function convenienceLinkWhitelistAcct(userName) {
    var acct = await getAdditionalDataForAcct({
        username: userName
    });
    if (addAcctToWhiteList(acct) === true) saveWhiteListToStorage();
    $('.igBotInjectedLinkWhitelist[data-username="' + acct.username + '"]').fadeOut();
    $('.igBotInjectedLinkUnfollow[data-username="' + acct.username + '"]').fadeOut();
}

function waitForTrue(variableNames, callback, args) {
    var allTrue = true;
    var waitingFor = 'waiting for ';
    for (var i = 0; i < variableNames.length; i++) {
        if (window[variableNames[i]] === false) {
            allTrue = false;
            waitingFor = waitingFor + variableNames[i] + ' ';
        } else {
            waitingFor = waitingFor.replace(variableNames[i], '');
        }
    }

    if (allTrue === true) {
        printMessage(chrome.i18n.getMessage('Done'));
        callback.apply(this, args);
    } else {
        timeoutsQueue.push(setTimeout(function() {
            waitForTrue(variableNames, callback, args);
        }, 1000));
    }

}

function loadOptions() {
    chrome.storage.local.get("gblOptions", function(data) {
        if (typeof data.gblOptions != 'undefined') {
            gblOptions = data.gblOptions;

            if (typeof gblOptions.filterOptions == 'undefined') {
                gblOptions.filterOptions = defaultFilterOptions;
            }

            // for newly added options: set gblOptions.xxxx to default option if .xxxx wasn't in previously saved options
            for (var key in defaultOptions) {
                if (gblOptions.hasOwnProperty(key) === false) {
                    gblOptions[key] = defaultOptions[key];
                }
            }

            // for newly added filter options: set gblOptions.filterOptions.xxxx to default option if .xxxx wasn't in previously saved options
            for (var key in defaultFilterOptions) {
                if (gblOptions.filterOptions.hasOwnProperty(key) === false) {
                    gblOptions.filterOptions[key] = defaultFilterOptions[key];
                }
            }

            document.getElementById('textSecondsBetweenActions').value = gblOptions.timeDelay / 1000;
            document.getElementById('textSecondsAfterSkip').value = gblOptions.timeDelayAfterSkip / 1000;
            document.getElementById('textMinutesAfterSoftRateLimit').value = gblOptions.timeDelayAfterSoftRateLimit / 60000;
            document.getElementById('textMinutesAfter429RateLimit').value = gblOptions.timeDelayAfter429RateLimit / 60000;
            document.getElementById('textHoursAfterHardRateLimit').value = gblOptions.timeDelayAfterHardRateLimit / 3600000;
            document.getElementById('texttimeDelayAfterAdditionalInfo').value = gblOptions.timeDelayAfterAdditionalInfo / 1000;
            document.getElementById('cbuseTimeDelayAfterAdditionalInfo').checked = gblOptions.useTimeDelayAfterAdditionalInfo;
            document.getElementById('cbRandomizeTimeDelay').checked = gblOptions.useRandomTimeDelay;
            document.getElementById('cbFollowPrivateAccounts').checked = gblOptions.followPrivateAccounts;
            document.getElementById('cbFilterNonPrivate').checked = gblOptions.filterOptions.non_private;
            document.getElementById('cbFilterVerified').checked = gblOptions.filterOptions.verified;
            document.getElementById('cbFilterNonVerified').checked = gblOptions.filterOptions.non_verified;
            document.getElementById('cbFilterBusiness').checked = gblOptions.filterOptions.is_business_account;
            document.getElementById('cbFilterNonBusiness').checked = gblOptions.filterOptions.non_is_business_account;
            document.getElementById('cbFilterJoinedRecently').checked = gblOptions.filterOptions.is_joined_recently;
            document.getElementById('cbFilterNonJoinedRecently').checked = gblOptions.filterOptions.non_is_joined_recently;
            document.getElementById('cbFollowsMe').checked = gblOptions.filterOptions.follows_me;
            document.getElementById('cbNonFollowsMe').checked = gblOptions.filterOptions.non_follows_me;
            document.getElementById('cbFollowedByMe').checked = gblOptions.filterOptions.followed_by_me;
            document.getElementById('cbNonFollowedByMe').checked = gblOptions.filterOptions.non_followed_by_me;
            document.getElementById('cbFilterNoProfilePic').checked = gblOptions.filterOptions.no_profile_pic;
            document.getElementById('cbFilterProfilePic').checked = gblOptions.filterOptions.profile_pic;
            document.getElementById('cbApplyFilterAutomatically').checked = gblOptions.filterOptions.applyFiltersAutomatically;
            document.getElementById('igBotPercentRandomTimeDelay').value = gblOptions.percentRandomTimeDelay * 200;
            document.getElementById('cbDontUnfollowFollowers').checked = gblOptions.dontUnFollowFollowers;
            document.getElementById('cbDontUnfollowNonGrowbot').checked = gblOptions.dontUnFollowNonGrowbot;
            document.getElementById('cbDontUnfollowFilters').checked = gblOptions.dontUnFollowFilters;
            document.getElementById('cbDontRemoveOrBlockFilters').checked = gblOptions.dontRemoveOrBlockFilters;
            document.getElementById('cbDontUnfollowFresh').checked = !gblOptions.unFollowFresh;
            document.getElementById('cbUnfollowOld').checked = gblOptions.unFollowIfOld;
            document.getElementById('textUnfollowNew').value = gblOptions.unFollowDelay / 86400000;
            document.getElementById('textUnfollowOld').value = gblOptions.unFollowIfOlderThan / 86400000;
            document.getElementById('cbLimitQueueSize').checked = gblOptions.limitQueue;
            document.getElementById('txtLimitQueueSize').value = gblOptions.maxAcctQueueLength;
            document.getElementById('numberFollowLikeLatestPics').value = gblOptions.numberFollowLikeLatestPics || 1;
            document.getElementById('cbRemoveFromQueue').checked = gblOptions.removeAccountsFromQueue;
            document.getElementById('cbAutoSaveQueue').checked = gblOptions.autoSaveQueue;
            document.getElementById('cbShowStamps').checked = gblOptions.showStamps;
            document.getElementById('cbShowProfilePicInQueue').checked = gblOptions.showProfilePicInQueue;
            document.getElementById('cbConvenienceLinks').checked = gblOptions.showConvenienceButtons;
            document.getElementById('cbFollowAlreadyAttempted').checked = gblOptions.followPeopleAlreadyAttempted;
            document.getElementById('cbShowLikesInQueue').checked = gblOptions.showLikesInQueue;
            document.getElementById('cbShowUnfollowingInQueue').checked = gblOptions.showUnfollowingInQueue;
            document.getElementById('cbClickNotNow').checked = gblOptions.clickNotNow;
            document.getElementById('cbLoadQueueOnStartup').checked = gblOptions.loadQueueOnStartup;
            document.getElementById('cbLimitActions').checked = gblOptions.maxPerEnabled;
            document.getElementById('textLimitActionsPer').value = gblOptions.maxPerActions;
            document.getElementById('textLimitActionsPerTime').value = gblOptions.maxPerPeriod / 3600000;
            document.getElementById('cbFilterBioContains').checked = gblOptions.filterOptions.bio_contains;
            document.getElementById('cbFilterBioNotContains').checked = gblOptions.filterOptions.bio_not_contains;
            document.getElementById('txtFilterBioContains').value = gblOptions.filterOptions.bio_contains_text;
            document.getElementById('txtFilterBioNotContains').value = gblOptions.filterOptions.bio_not_contains_text;
            document.getElementById('cbFilterExternalUrlContains').checked = gblOptions.filterOptions.external_url_contains;
            document.getElementById('cbFilterExternalUrlNotContains').checked = gblOptions.filterOptions.external_url_not_contains;
            document.getElementById('txtFilterExternalUrlContains').value = gblOptions.filterOptions.external_url_contains_text;
            document.getElementById('txtFilterExternalUrlNotContains').value = gblOptions.filterOptions.external_url_not_contains_text;
            document.getElementById('cbFilterBusinessCategoryNameContains').checked = gblOptions.filterOptions.business_category_name_contains;
            document.getElementById('cbFilterBusinessCategoryNameNotContains').checked = gblOptions.filterOptions.business_category_name_not_contains;
            document.getElementById('txtFilterBusinessCategoryNameContains').value = gblOptions.filterOptions.business_category_name_contains_text;
            document.getElementById('txtFilterBusinessCategoryNameNotContains').value = gblOptions.filterOptions.business_category_name_not_contains_text;
            $('#paginationLimit option:selected').attr("selected", null);
            $('#paginationLimit option[value="' + gblOptions.paginationLimit + '"]').attr("selected", "selected");
            $('#paginationLimit').trigger('change');

            // setFilterIconOpacity();

            if (typeof gblOptions.ui == 'undefined' || gblOptions.ui.length == 0) {
                [...document.getElementsByTagName('details')].forEach((detailsEl) => {
                    detailsEl.setAttribute('open', true)
                });
            } else {
                gblOptions.ui.forEach((detailsOpt) => {
                    if (detailsOpt.open == true) {
                        var el = document.getElementById(detailsOpt.id);
                        if (el) el.setAttribute('open', true);
                    }
                });
            }

        }

        if (typeof gblOptions.filterOptions == 'undefined') {
            gblOptions.filterOptions = defaultFilterOptions;
        }

        bindNoUiSliders();

    });
}

function setFilterIconOpacity() {
    if (gblOptions.filterOptions.applyFiltersAutomatically == true && $('#radioFollow').is(':checked') == true) {
        document.getElementById('iconFilter').style.opacity = 1;
    } else if (gblOptions.dontUnFollowFilters == true && $('#radioUnFollow').is(':checked') == true) {
        document.getElementById('iconFilter').style.opacity = 1;
    } else if (gblOptions.dontRemoveOrBlockFilters == true && ($('#radioRemoveFromFollowers').is(':checked') == true || $('#radioBlock').is(':checked') == true)) {
        document.getElementById('iconFilter').style.opacity = 1;
    } else {
        document.getElementById('iconFilter').style.opacity = 0.5;
    }
}

function saveOptions() {

    gblOptions.filterOptions.applyFiltersAutomatically = document.getElementById('cbApplyFilterAutomatically').checked;
    gblOptions.filterOptions.private = document.getElementById('cbFollowPrivateAccounts').checked;
    gblOptions.filterOptions.non_private = document.getElementById('cbFilterNonPrivate').checked;
    gblOptions.filterOptions.verified = document.getElementById('cbFilterVerified').checked;
    gblOptions.filterOptions.non_verified = document.getElementById('cbFilterNonVerified').checked;
    gblOptions.filterOptions.follows_me = document.getElementById('cbFollowsMe').checked;
    gblOptions.filterOptions.non_follows_me = document.getElementById('cbNonFollowsMe').checked;
    gblOptions.filterOptions.followed_by_me = document.getElementById('cbFollowedByMe').checked;
    gblOptions.filterOptions.non_followed_by_me = document.getElementById('cbNonFollowedByMe').checked;
    gblOptions.filterOptions.is_joined_recently = document.getElementById('cbFilterJoinedRecently').checked;
    gblOptions.filterOptions.non_is_joined_recently = document.getElementById('cbFilterNonJoinedRecently').checked;
    gblOptions.filterOptions.is_business_account = document.getElementById('cbFilterBusiness').checked;
    gblOptions.filterOptions.non_is_business_account = document.getElementById('cbFilterNonBusiness').checked;
    gblOptions.filterOptions.bio_contains = document.getElementById('cbFilterBioContains').checked;
    gblOptions.filterOptions.bio_not_contains = document.getElementById('cbFilterBioNotContains').checked;
    gblOptions.filterOptions.bio_contains_text = document.getElementById('txtFilterBioContains').value;
    gblOptions.filterOptions.bio_not_contains_text = document.getElementById('txtFilterBioNotContains').value;
    gblOptions.filterOptions.external_url_contains = document.getElementById('cbFilterExternalUrlContains').checked;
    gblOptions.filterOptions.external_url_not_contains = document.getElementById('cbFilterExternalUrlNotContains').checked;
    gblOptions.filterOptions.external_url_contains_text = document.getElementById('txtFilterExternalUrlContains').value;
    gblOptions.filterOptions.external_url_not_contains_text = document.getElementById('txtFilterExternalUrlNotContains').value;
    gblOptions.filterOptions.no_profile_pic = document.getElementById('cbFilterNoProfilePic').checked;
    gblOptions.filterOptions.profile_pic = document.getElementById('cbFilterProfilePic').checked;
    gblOptions.filterOptions.business_category_name_contains = document.getElementById('cbFilterBusinessCategoryNameContains').checked;
    gblOptions.filterOptions.business_category_name_not_contains = document.getElementById('cbFilterBusinessCategoryNameNotContains').checked;
    gblOptions.filterOptions.business_category_name_contains_text = document.getElementById('txtFilterBusinessCategoryNameContains').value;
    gblOptions.filterOptions.business_category_name_not_contains_text = document.getElementById('txtFilterBusinessCategoryNameNotContains').value;


    var uiOptions = [];

    [...document.getElementsByTagName('details')].forEach((detailsEl) => {
        uiOptions.push({
            'id': detailsEl.id,
            'open': detailsEl.open ? true : false
        });
    });

    var filterOptions = gblOptions.filterOptions;

    gblOptions = {
        dontUnFollowFollowers: document.getElementById('cbDontUnfollowFollowers').checked,
        dontUnFollowNonGrowbot: document.getElementById('cbDontUnfollowNonGrowbot').checked,
        dontUnFollowFilters: document.getElementById('cbDontUnfollowFilters').checked,
        dontRemoveOrBlockFilters: document.getElementById('cbDontRemoveOrBlockFilters').checked,
        filterOptions: filterOptions,
        followPeopleAlreadyAttempted: document.getElementById('cbFollowAlreadyAttempted').checked,
        followPrivateAccounts: document.getElementById('cbFollowPrivateAccounts').checked,
        limitQueue: document.getElementById('cbLimitQueueSize').checked,
        maxAcctQueueLength: parseInt(document.getElementById('txtLimitQueueSize').value),
        numberFollowLikeLatestPics: document.getElementById('numberFollowLikeLatestPics').value,
        percentRandomTimeDelay: document.getElementById('igBotPercentRandomTimeDelay').value / 200,
        showLikesInQueue: document.getElementById('cbShowLikesInQueue').checked,
        clickNotNow: document.getElementById('cbClickNotNow').checked,
        loadQueueOnStartup: document.getElementById('cbLoadQueueOnStartup').checked,
        showUnfollowingInQueue: document.getElementById('cbShowUnfollowingInQueue').checked,
        removeAccountsFromQueue: document.getElementById('cbRemoveFromQueue').checked,
        autoSaveQueue: document.getElementById('cbAutoSaveQueue').checked,
        showConvenienceButtons: document.getElementById('cbConvenienceLinks').checked,
        showStamps: document.getElementById('cbShowStamps').checked,
        showProfilePicInQueue: document.getElementById('cbShowProfilePicInQueue').checked,
        timeDelay: document.getElementById('textSecondsBetweenActions').value * 1000,
        timeDelayAfterHardRateLimit: document.getElementById('textHoursAfterHardRateLimit').value * 3600000,
        timeDelayAfterSkip: document.getElementById('textSecondsAfterSkip').value * 1000,
        timeDelayAfterSoftRateLimit: document.getElementById('textMinutesAfterSoftRateLimit').value * 60000,
        timeDelayAfter429RateLimit: document.getElementById('textMinutesAfter429RateLimit').value * 60000,
        timeDelayAfterAdditionalInfo: document.getElementById('texttimeDelayAfterAdditionalInfo').value * 1000,
        useTimeDelayAfterAdditionalInfo: document.getElementById('cbuseTimeDelayAfterAdditionalInfo').checked,
        ui: uiOptions,
        unFollowFresh: !document.getElementById('cbDontUnfollowFresh').checked,
        unFollowIfOld: document.getElementById('cbUnfollowOld').checked,
        unFollowDelay: parseInt(document.getElementById('textUnfollowNew').value) * 86400000,
        unFollowIfOlderThan: parseInt(document.getElementById('textUnfollowOld').value) * 86400000,
        useRandomTimeDelay: document.getElementById('cbRandomizeTimeDelay').checked,
        maxPerEnabled: document.getElementById('cbLimitActions').checked,
        maxPerActions: document.getElementById('textLimitActionsPer').value,
        maxPerPeriod: document.getElementById('textLimitActionsPerTime').value * 3600000,
        paginationLimit: $('#paginationLimit').val()
    };

    chrome.storage.local.set({
        gblOptions: gblOptions
    });

    // setFilterIconOpacity();
}


function loadPreviousAttempts() {
    chrome.storage.local.get("acctsAttempted", function(data) {
        if (Array.isArray(data.acctsAttempted)) {
            acctsPreviouslyAttempted = data.acctsAttempted;
            printMessage(chrome.i18n.getMessage('PreviouslyAttempted', [acctsPreviouslyAttempted.length]));

            acctsPreviouslyAttempted = cleanAcctsForStorage(acctsPreviouslyAttempted);
            chrome.storage.local.set({
                acctsAttempted: acctsPreviouslyAttempted
            }, function() {});;
        }
    })
}



function cleanAcctsForStorage(queueToOptimize) {
    var previousBytes = bytesFromString(JSON.stringify(queueToOptimize));

    for (var i = 0; i < queueToOptimize.length; i++) {
        var a = queueToOptimize[i];
        if (a.edge_felix_video_timeline) delete queueToOptimize[i].edge_felix_video_timeline;
        if (a.edge_felix_combined_post_uploads) delete queueToOptimize[i].edge_felix_combined_post_uploads;
        if (a.edge_felix_combined_draft_uploads) delete queueToOptimize[i].edge_felix_combined_draft_uploads;
        if (a.edge_felix_drafts) delete queueToOptimize[i].edge_felix_drafts;
        if (a.edge_felix_pending_draft_uploads) delete queueToOptimize[i].edge_felix_pending_draft_uploads;
        if (a.edge_felix_pending_post_uploads) delete queueToOptimize[i].edge_felix_pending_post_uploads;
        if (a.edge_saved_media) delete queueToOptimize[i].edge_saved_media;
        if (a.edge_media_collections) delete queueToOptimize[i].edge_media_collections;
        if (a.edge_owner_to_timeline_media && a.edge_owner_to_timeline_media.edges) queueToOptimize[i].edge_owner_to_timeline_media.edges = [];
    }

    var nowBytes = bytesFromString(JSON.stringify(queueToOptimize));
    var savedBytes = previousBytes - nowBytes;

    if (savedBytes > 0) {
        printMessage('Cleaned up accounts for storage and performance (saved ' + formatBytes(savedBytes) + ')');
    }

    return queueToOptimize;
}

function bytesFromString(str) {
    var bytes = 0,
        len = str.length,
        codePoint, next, i;

    for (i = 0; i < len; i++) {
        codePoint = str.charCodeAt(i);

        // Lone surrogates cannot be passed to encodeURI
        if (codePoint >= 0xD800 && codePoint < 0xE000) {
            if (codePoint < 0xDC00 && i + 1 < len) {
                next = str.charCodeAt(i + 1);

                if (next >= 0xDC00 && next < 0xE000) {
                    bytes += 4;
                    i++;
                    continue;
                }
            }
        }

        bytes += (codePoint < 0x80 ? 1 : (codePoint < 0x800 ? 2 : 3));
    }

    return bytes;
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function loadPreviousLikes() {
    chrome.storage.local.get("previousLikes", function(data) {
        if (Array.isArray(data.previousLikes)) {
            previousLikes = data.previousLikes;
            printMessage(chrome.i18n.getMessage('PreviouslyLiked', [previousLikes.length]));
        }
    })
}

function savePreviousLikesToStorage() {
    chrome.storage.local.set({
        previousLikes: previousLikes
    });
}

function addAcctToWhiteList(acct) {
    var acctInWhiteList = findAcctById(acct.id, acctsWhiteList);
    if (acct !== false && acctInWhiteList == false) {
        acctsWhiteList.push(acct);
        printMessage(acct.username + chrome.i18n.getMessage('AddedToWhitelist'));
        return true;
    } else {
        printMessage(acct.username + chrome.i18n.getMessage('AlreadyOnWhitelist'));
        return false;
    }
}

function loadWhiteList() {
    chrome.storage.local.get("acctsWhiteList", function(data) {
        if (Array.isArray(data.acctsWhiteList)) {
            acctsWhiteList = data.acctsWhiteList;
            printMessage(chrome.i18n.getMessage('WhitelistLoaded', [acctsWhiteList.length]));
        }
    })
}

function saveWhiteListToStorage() {
    chrome.storage.local.set({
        acctsWhiteList: acctsWhiteList
    });
    printMessage(chrome.i18n.getMessage('WhitelistSavedLocal'));
}

function saveWhiteListToDisk() {
    saveText("growbot-whitelist.txt", JSON.stringify(acctsWhiteList));
    printMessage(chrome.i18n.getMessage('WhitelistSavedFile'));
}

function saveWhiteListToStorageAndDisk() {
    saveWhiteListToStorage();
    saveWhiteListToDisk();
}

function saveText(filename, text) {
    var blob = new Blob([text], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, filename);
}

function viewWhiteList() {
    if (acctsWhiteList.length > 0) {

        dialog({
                yes: chrome.i18n.getMessage('WhitelistLoadFile'),
                no: chrome.i18n.getMessage('WhitelistLoadLocal'),
                question: chrome.i18n.getMessage('WhitelistLoadQuestion')
            },
            function() {
                openWhiteListFile()
            },
            function() {
                currentList = 'acctsWhiteList';
                arrayOfUsersToDiv(acctsWhiteList, true);
                $('#btnSaveWhiteList').show();
            });

    } else {
        openWhiteListFile();
    }
}

function openWhiteListFile() {
    var input = document.createElement("input");
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'text/plain');

    input.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            var myFile = this.files[0];
            var reader = new FileReader();

            reader.addEventListener('load', function(e) {
                acctsWhiteList = JSON.parse(e.target.result);
                currentList = 'acctsWhiteList';
                arrayOfUsersToDiv(acctsWhiteList, true);
            });

            reader.readAsText(myFile);
        }
    });

    input.click();
}



function openQueueFile() {
    var input = document.createElement("input");
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'text/plain');

    input.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            var myFile = this.files[0];
            var reader = new FileReader();

            reader.addEventListener('load', function(e) {
                acctsQueue = JSON.parse(e.target.result);
                currentList = 'acctsQueue';

                if (acctsQueue.length > gblOptions.maxAcctQueueLength &&
                    gblOptions.limitQueue == true &&
                    window.confirm('Saved queue has ' + acctsQueue.length + ' accounts, limit to first ' + gblOptions.maxAcctQueueLength + ' accounts?')) {

                    truncateQueue();
                }

                acctsQueue = cleanAcctsForStorage(acctsQueue);

                arrayOfUsersToDiv(acctsQueue, true);

            });

            reader.readAsText(myFile);
        }
    });

    input.click();
}



function loadSavedQueue() {
    chrome.storage.local.get("acctsQueue", function(data) {
        if (Array.isArray(data.acctsQueue)) {

            dialog({
                    no: chrome.i18n.getMessage('QueueLoadFile'),
                    yes: chrome.i18n.getMessage('QueueLoadLocal'),
                    question: chrome.i18n.getMessage('QueueLoadQuestion')
                },
                function() {
                    acctsQueue = data.acctsQueue;

                    if (acctsQueue.length > gblOptions.maxAcctQueueLength &&
                        gblOptions.limitQueue == true &&
                        window.confirm('Saved queue has ' + acctsQueue.length + ' accounts, limit to first ' + gblOptions.maxAcctQueueLength + ' accounts?')) {

                        truncateQueue();
                    }

                    arrayOfUsersToDiv(acctsQueue, true);

                    printMessage(chrome.i18n.getMessage('QueueLoaded', [acctsQueue.length]));
                },
                function() {
                    openQueueFile();
                })
        } else {
            openQueueFile();
        }
    });
}


function loadQueueFromLocal() {
    chrome.storage.local.get("acctsQueue", function(data) {
        if (Array.isArray(data.acctsQueue)) {

            acctsQueue = data.acctsQueue;

            arrayOfUsersToDiv(acctsQueue, true);

            printMessage(chrome.i18n.getMessage('QueueLoaded', [acctsQueue.length]));
        }
    });
}


function saveQueueToDisk() {
    saveText("growbot-queue.txt", JSON.stringify(acctsQueue));
    printMessage(chrome.i18n.getMessage('QueueSavedFile'));
}

function saveQueueToStorage() {
    chrome.storage.local.set({
        acctsQueue: acctsQueue
    }, function() {
        printMessage(chrome.i18n.getMessage('QueueSavedLocal'));
    });
}

function saveQueueToStorageAndDisk() {
    saveQueueToStorage();
    saveQueueToDisk();
}



function initUnfollowMyFollowers() {
    if (acctsQueue.length === 0 && window.confirm('Queue empty, load your following and begin unfollowing?') === true) {
        ajaxGetAllMyFollowing('');
        waitForTrue(['loadedMyFollowings'], ajaxUnfollowAll, []);
    } else {
        ajaxUnfollowAll();
    }
}


function ajaxLoadUsersMedia(after, loadAllMedia, callback, userid) {

    if (typeof after != 'string') {
        after = '';
    }

    if (isNaN(userid)) {
        userid = currentProfilePage.id;
    }

    var jsonvars = {
        id: userid,
        first: 12
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=6305d415e36c0a5f0abb6daba312f2dd&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url).done(function(r) {
        callback(r);
    }).fail(function(f) {
        if (f.status == 429) {
            printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
            timeoutsQueue.push(setTimeout(function() {
                ajaxLoadUsersMedia(after, loadAllMedia, callback, userid);
            }, gblOptions.timeDelayAfter429RateLimit));
        }
    });
}


function ajaxLoadAllUsersCommenters(after) {
    if (typeof after != 'string') {
        after = '';
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 12
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=6305d415e36c0a5f0abb6daba312f2dd&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url).done(function(r) {
        loadCommentsForMedia(r);
    }).fail(function(f) {
        if (f.status == 429) {
            printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
            timeoutsQueue.push(setTimeout(function() {
                ajaxLoadAllUsersCommenters(after);
            }, gblOptions.timeDelayAfter429RateLimit));
        }
    });
}

async function loadCommentsForMedia(r) {
    for (var i = 0; i < r.data.user.edge_owner_to_timeline_media.edges.length; i++) {
        var media = r.data.user.edge_owner_to_timeline_media.edges[i];

        if (media.node.edge_media_to_comment.page_info.has_next_page == true) {
            if (gblOptions.limitQueue == false || (gblOptions.limitQueue == true && mediaForComments.length < gblOptions.maxAcctQueueLength)) {
                var retMedia = await loadMoreCommentsForMedia(media);
                mediaForComments.push(retMedia);
            }
        } else {
            mediaForComments.push(media);
        }
    }

    if (getCommentersFromMediaArray() == false) {
        printMessage(chrome.i18n.getMessage('Done') + chrome.i18n.getMessage('QueueLimitReached'));
        return false;
    }

    if (r.data.user.edge_owner_to_timeline_media.page_info.has_next_page == true) {
        outputMessage('waiting 2 seconds to load more media for comments');
        timeoutsQueue.push(setTimeout(function() {
            ajaxLoadAllUsersCommenters(r.data.user.edge_owner_to_timeline_media.page_info.end_cursor);
        }, 2000));
    } else {
        printMessage(chrome.i18n.getMessage('Done'));
    }
}

function loadMoreCommentsForMedia(media) {
    return new Promise(function(resolve, reject) {

        if (getCommentersFromMediaArray() == false) {
            printMessage(chrome.i18n.getMessage('Done') + chrome.i18n.getMessage('QueueLimitReached'));
            return false;
        }

        var jsonvars = {
            shortcode: media.node.shortcode,
            first: 48
        }

        if (media.node.edge_media_to_comment.page_info.has_next_page === true) {
            jsonvars.after = media.node.edge_media_to_comment.page_info.end_cursor;
        }

        var urljsonvars = JSON.stringify(jsonvars);

        var url = 'https://www.instagram.com/graphql/query/?query_hash=33ba35852cb50da46f5b5e889df7d159&variables=' + encodeURIComponent(urljsonvars);

        let retMedia = media;

        $.ajax(url).done(function(r) {

            for (var i = 0; i < r.data.shortcode_media.edge_media_to_comment.edges.length; i++) {
                retMedia.node.edge_media_to_comment.edges.push(r.data.shortcode_media.edge_media_to_comment.edges[i]);
            }

            if (r.data.shortcode_media.edge_media_to_comment.page_info.has_next_page === true) {
                retMedia.node.edge_media_to_comment.page_info.end_cursor = r.data.shortcode_media.edge_media_to_comment.page_info.end_cursor;

                outputMessage('waiting 2 seconds to load more comments');


                if ((gblOptions.limitQueue == true && retMedia.node.edge_media_to_comment.edges.length > gblOptions.maxAcctQueueLength)) {
                    resolve(retMedia);
                    return false;
                }

                timeoutsQueue.push(setTimeout(function() {
                    resolve(loadMoreCommentsForMedia(retMedia));
                }, 2000));
            } else {
                resolve(retMedia);
            }

        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    resolve(loadMoreCommentsForMedia(retMedia));
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });

    });
}


function getCommentersFromMediaArray() {
    let accountsThatCommented = [];

    for (var i = 0; i < mediaForComments.length; i++) {
        var media = mediaForComments[i];

        for (var j = 0; j < media.node.edge_media_to_comment.edges.length; j++) {
            var comment = media.node.edge_media_to_comment.edges[j];

            if (accountIdsThatCommented.indexOf(comment.node.owner.id) == -1) {
                accountIdsThatCommented.push(comment.node.owner.id);
                //var acct = await getAdditionalDataForAcct(comment.node.owner);
                //accountsThatCommented.push(acct);
                accountsThatCommented.push(comment.node.owner);
            }
        }
    }

    if (acctsQueue.length == 0) {
        acctsQueue = accountsThatCommented;
    } else {
        for (var i = 0; i < accountsThatCommented.length; i++) {
            if ((gblOptions.limitQueue == true && acctsQueue.length < gblOptions.maxAcctQueueLength) || gblOptions.limitQueue == false) {
                if (findAcctById(accountsThatCommented[i].id, acctsQueue) === false) {
                    acctsQueue.push(accountsThatCommented[i]);
                }
            } else {
                arrayOfUsersToDiv(accountsThatCommented, false);
                return false;
            }
        }
    }

    arrayOfUsersToDiv(accountsThatCommented, false);
}



function ajaxLoadAllUsersLikers(after) {
    if (typeof after != 'string') {
        after = '';
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 12
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=6305d415e36c0a5f0abb6daba312f2dd&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url).done(function(r) {
        beginLoadLikesForMedia(r);
    }).fail(function(f) {
        if (f.status == 429) {
            printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
            timeoutsQueue.push(setTimeout(function() {
                ajaxLoadAllUsersLikers(after);
            }, gblOptions.timeDelayAfter429RateLimit));
        }
    });
}

async function beginLoadLikesForMedia(r) {

    for (var i = 0; i < r.data.user.edge_owner_to_timeline_media.edges.length; i++) {
        var media = r.data.user.edge_owner_to_timeline_media.edges[i];
        var retMedia = await loadLikesForMedia(media);
        mediaForLikes.push(retMedia);


        var queueLimit = getLikersFromMediaArray();

        if (queueLimit == false) {
            printMessage(chrome.i18n.getMessage('Done') + chrome.i18n.getMessage('QueueLimitReached'));
            return false;
        } else {
            mediaForLikes = [];
        }

    }

    if (r.data.user.edge_owner_to_timeline_media.page_info.has_next_page == true) {
        outputMessage('waiting 2 seconds to load more media for likes');
        timeoutsQueue.push(setTimeout(function() {
            ajaxLoadAllUsersLikers(r.data.user.edge_owner_to_timeline_media.page_info.end_cursor);
        }, 2000));
    } else {
        printMessage(chrome.i18n.getMessage('Done'));
    }
}

function loadLikesForMedia(media) {

    return new Promise(function(resolve, reject) {

        if (getLikersFromMediaArray() == false) {
            printMessage(chrome.i18n.getMessage('Done') + chrome.i18n.getMessage('QueueLimitReached'));
            return false;
        }

        let retMedia = false;

        var shortcode;
        if (media.node) {
            shortcode = media.node.shortcode
        } else {
            retMedia = media;
            shortcode = media.data.shortcode_media.shortcode;
        }

        var jsonvars = {
            shortcode: shortcode,
            first: 48
        }

        if (media.data && media.data.shortcode_media && media.data.shortcode_media.edge_liked_by && media.data.shortcode_media.edge_liked_by.page_info.has_next_page === true) {
            jsonvars.after = media.data.shortcode_media.edge_liked_by.page_info.end_cursor;
        }

        var urljsonvars = JSON.stringify(jsonvars);

        var url = 'https://www.instagram.com/graphql/query/?query_hash=1cb6ec562846122743b61e492c85999f&variables=' + encodeURIComponent(urljsonvars);

        $.ajax(url).done(function(r) {

            if (retMedia == false) {
                retMedia = r;
            } else {
                for (var i = 0; i < r.data.shortcode_media.edge_liked_by.edges.length; i++) {
                    retMedia.data.shortcode_media.edge_liked_by.edges.push(r.data.shortcode_media.edge_liked_by.edges[i].node);
                }
            }

            if (r.data.shortcode_media.edge_liked_by.page_info.has_next_page === true) {
                retMedia.data.shortcode_media.edge_liked_by.page_info.end_cursor = r.data.shortcode_media.edge_liked_by.page_info.end_cursor;
                outputMessage('waiting 2 seconds to load more likes');

                if ((gblOptions.limitQueue == true && retMedia.data.shortcode_media.edge_liked_by.edges.length > gblOptions.maxAcctQueueLength)) {
                    resolve(retMedia);
                    return false;
                }

                timeoutsQueue.push(setTimeout(function() {
                    resolve(loadLikesForMedia(retMedia));
                }, 2000));
            } else {
                resolve(retMedia);
            }


        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    resolve(loadLikesForMedia(media));
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });

    });
}


function getLikersFromMediaArray() {
    let accountsThatLiked = [];

    for (var i = 0; i < mediaForLikes.length; i++) {
        var media = mediaForLikes[i];

        for (var j = 0; j < media.data.shortcode_media.edge_liked_by.edges.length; j++) {
            var like = media.data.shortcode_media.edge_liked_by.edges[j].node;
            if (typeof like == 'undefined') {
                like = media.data.shortcode_media.edge_liked_by.edges[j];
            }
            if (accountIdsThatLiked.indexOf(like.id) == -1) {
                accountIdsThatLiked.push(like.id);
                accountsThatLiked.push(like);
            }
        }
    }

    if (acctsQueue.length == 0) {
        acctsQueue = accountsThatLiked;
    } else {
        for (var i = 0; i < accountsThatLiked.length; i++) {
            if ((gblOptions.limitQueue == true && acctsQueue.length < gblOptions.maxAcctQueueLength) || gblOptions.limitQueue == false) {
                if (findAcctById(accountsThatLiked[i].id, acctsQueue) === false) {
                    acctsQueue.push(accountsThatLiked[i]);
                }
            } else {
                arrayOfUsersToDiv(accountsThatLiked, false);
                return false;
            }
        }
    }

    arrayOfUsersToDiv(accountsThatLiked, false);
}


function ajaxGetPendingFollowRequests(after) {

    alert('Sorry, but Instagram has disabled this feature :(\n\nYou can download your data from:\n\nhttps://www.instagram.com/download/request');
    return false;

    $('#btnLoadPendingRequests').addClass('pulsing');

    if (typeof after != 'string') {
        acctsQueue = [];
        after = '';
    }

    var url = 'https://www.instagram.com/accounts/access_tool/current_follow_requests?__a=1';

    if (after != '') {
        url = url + '&cursor=' + after;
    }

    $.ajax(url)
        .done(function(r) {
            var tmpQueue = [];

            var promises = [];

            $(r.data.data).each(function(edge) {

                var u = {
                    username: $(this)[0].text
                }

                var promise = new Promise(async function(resolve, reject) {
                    u = await getAdditionalDataForAcct(u);
                    acctsQueue.push(u);
                    tmpQueue.push(u);
                    resolve(u);
                });
                promises.push(promise);

            });

            var result = Promise.all(promises);

            result.then(function(data) {
                arrayOfUsersToDiv(tmpQueue, false);

                if (r.data.cursor && (acctsQueue.length < parseInt(gblOptions.maxAcctQueueLength) || gblOptions.limitQueue != true)) {
                    printMessage(chrome.i18n.getMessage('AccountsLoaded', [tmpQueue.length.toString(), acctsQueue.length.toString()]));
                    ajaxGetPendingFollowRequests(r.data.cursor);
                } else {
                    $('#btnLoadPendingRequests').removeClass('pulsing');
                    printMessage(chrome.i18n.getMessage('Done'));
                }

            })


        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    ajaxGetPendingFollowRequests(after);
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });


}


function ajaxGetAllUsersFollowers(after) {
    if (typeof after != 'string') {
        // acctsQueue = [];
        after = '';

        if (currentProfilePage.edge_followed_by.count > gblOptions.maxAcctQueueLength && gblOptions.limitQueue == true) {
            var promptAfter = window.prompt("Account has " + currentProfilePage.edge_followed_by.count + " followers, but your queue limit is set to " + gblOptions.maxAcctQueueLength + ". \n\n Enter follower number to begin at (0 is the most recent follower).", "0")
            if (!isNaN(parseInt(promptAfter))) {
                gblOptions.truncateStart = parseInt(promptAfter);
            }
        }
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=37479f2b8209594dde7facb0d904896a&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_followed_by.edges).each(function(edge) {
                var u = $(this)[0].node;
                acctsQueue.push(u);
                tmpQueue.push(u);
            });

            //arrayOfUsersToDiv(tmpQueue, false);

            printMessage(chrome.i18n.getMessage('AccountsLoaded', [tmpQueue.length, acctsQueue.length]));

            if (r.data.user.edge_followed_by.page_info.has_next_page == true && (acctsQueue.length < (parseInt(gblOptions.truncateStart) + parseInt(gblOptions.maxAcctQueueLength)) || gblOptions.limitQueue != true || currentProfilePage.edge_followed_by.count < parseInt(gblOptions.maxAcctQueueLength))) {
                ajaxGetAllUsersFollowers(r.data.user.edge_followed_by.page_info.end_cursor);
            } else {

                truncateQueue(gblOptions.truncateStart);

                $('#btnProcessQueue').removeClass('pulsing');

                arrayOfUsersToDiv(acctsQueue, true);

                printMessage(chrome.i18n.getMessage('Done'));
                printMessage(' ');

            }


        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    ajaxGetAllUsersFollowers(after);
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });

}


function ajaxLoadFollowing(after) {

    if (typeof after != 'string') {
        // acctsQueue = [];
        after = '';

        if (currentProfilePage.edge_follow.count > gblOptions.maxAcctQueueLength && gblOptions.limitQueue == true) {
            var promptAfter = window.prompt("Account is following " + currentProfilePage.edge_follow.count + " accounts, but your queue limit is set to " + gblOptions.maxAcctQueueLength + ". \n\n Enter following number to begin at (0 is the most recent following).", "0")
            if (!isNaN(parseInt(promptAfter))) {
                gblOptions.truncateStart = parseInt(promptAfter);
            }
        }
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=' + encodeURIComponent(urljsonvars);


    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_follow.edges).each(function(edge) {
                var u = $(this)[0].node;
                acctsQueue.push(u);
                tmpQueue.push(u);
            });

            //arrayOfUsersToDiv(tmpQueue, false);

            printMessage(chrome.i18n.getMessage('AccountsLoaded', [tmpQueue.length, acctsQueue.length]));

            if (r.data.user.edge_follow.page_info.has_next_page == true && (acctsQueue.length < (parseInt(gblOptions.truncateStart) + parseInt(gblOptions.maxAcctQueueLength)) || gblOptions.limitQueue != true || currentProfilePage.edge_follow.count < parseInt(gblOptions.maxAcctQueueLength))) {
                ajaxLoadFollowing(r.data.user.edge_follow.page_info.end_cursor);
            } else {
                truncateQueue(gblOptions.truncateStart);

                arrayOfUsersToDiv(acctsQueue, true);

                outputMessage(currentProfilePage.username + ' following loaded.  Count: ' + acctsQueue.length);
                printMessage(' ');

                loadedTheirFollowings = true;
            }

        });
}


function ajaxGetAllMyFollowers(after) {
    var jsonvars = {
        id: user.viewer.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=37479f2b8209594dde7facb0d904896a&variables=' + encodeURIComponent(urljsonvars);

    if (after != '') {
        url = url + '&after=' + after;
    }

    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_followed_by.edges).each(function(edge) {
                var u = $(this)[0].node;
                myFollowers.push(u);
                tmpQueue.push(u);
            });

            printMessage(chrome.i18n.getMessage('AccountsLoaded', [tmpQueue.length, myFollowers.length]));

            if (r.data.user.edge_followed_by.page_info.has_next_page == true) {
                ajaxGetAllMyFollowers(r.data.user.edge_followed_by.page_info.end_cursor);
            } else {
                outputMessage('Your Followers loaded.  Count: ' + myFollowers.length);
                printMessage(' ');

                loadedMyFollowers = true;
            }

        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    ajaxGetAllMyFollowers(after);
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });

}


function ajaxGetAllMyFollowing(after) {

    var jsonvars = {
        id: user.viewer.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_follow.edges).each(function(edge) {
                var u = $(this)[0].node;
                acctsQueue.push(u);
                tmpQueue.push(u);
            });

            if (document.getElementById('cbShowUnfollowingInQueue').checked == true) {
                arrayOfUsersToDiv(tmpQueue, false);
                var igBotQueueContainer = document.getElementById('igBotQueueContainer');
                igBotQueueContainer.scrollTop = igBotQueueContainer.scrollHeight;
            }

            printMessage(chrome.i18n.getMessage('AccountsLoaded', [tmpQueue.length, acctsQueue.length]));

            if (r.data.user.edge_follow.page_info.has_next_page == true) {
                ajaxGetAllMyFollowing(r.data.user.edge_follow.page_info.end_cursor);
            } else {
                outputMessage('Your following loaded.  Count: ' + acctsQueue.length);
                printMessage(' ');

                loadedMyFollowings = true;
            }

        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    ajaxGetAllMyFollowing(after);
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });
}



function isAdditionalDataFullyLoaded(q) {
    for (var i = 0; i < q.length; i++) {
        if (!q[i].edge_followed_by) {
            return false;
        }
    }
    return true;
}



function sortQueue(q, property, asc) {

    var propertySplit = property.split('.');

    if (propertySplit.length === 1) {
        q.sort(function(a, b) {
            // non-numeric properties like username
            if (isNaN(a[property])) {
                if (asc == true) {
                    return a[property].localeCompare(b[property]);
                } else {
                    return b[property].localeCompare(a[property]);
                }
            }
            // numeric properties like followers
            if (asc == true) {
                return a[property] - b[property];
            } else {
                return b[property] - a[property];
            }
        });
    } else if (propertySplit.length === 2) {
        q.sort(function(a, b) {
            if (asc == true) {
                return a[propertySplit[0]][propertySplit[1]] - b[propertySplit[0]][propertySplit[1]];
            } else {
                return b[propertySplit[0]][propertySplit[1]] - a[propertySplit[0]][propertySplit[1]];
            }
        });
    }

    return q;
}



function appendLastPostDateToAcct(a) {
    if (a.edge_owner_to_timeline_media.count > 0) {
        var sortedMedia = sortQueue(a.edge_owner_to_timeline_media.edges, 'node.taken_at_timestamp', false);
        var lastMediaDate = 0;
        if (sortedMedia.length > 0 && sortedMedia[0].node.taken_at_timestamp != 'undefined') {
            lastMediaDate = sortedMedia[0].node.taken_at_timestamp * 1000;
        }

        a.lastPostDate = lastMediaDate;

        var date1 = new Date(lastMediaDate);
        var date2 = new Date();
        var differenceInTime = date2.getTime() - date1.getTime();
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);

        a.lastPostDateInDays = differenceInDays;
    }
    return a;
}

function appendFollowersRatioToAcct(a) {
    if (a.edge_follow.count > 0 && a.edge_followed_by.count > 0) {
        a.followRatio = a.edge_followed_by.count / a.edge_follow.count;
    } else if (a.edge_followed_by.count > 0) {
        a.followRatio = a.edge_followed_by.count;
    } else {
        a.followRatio = 0;
    }

    return a;
}

function appendHasProfilePicToAcct(acct) {
    if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) > -1) {
        acct.has_profile_pic = 0;
    } else {
        acct.has_profile_pic = 1;
    }

    return acct;
}

function truncateQueue(start) {
    if (isNaN(parseInt(start))) start = 0;

    if (acctsQueue.length > gblOptions.maxAcctQueueLength && gblOptions.limitQueue != false) {
        var end = (start + gblOptions.maxAcctQueueLength);

        acctsQueue = acctsQueue.slice(start, end);

    }
}

function arrayOfMediaToDiv(q, clearDiv) {

    if (typeof clearDiv == 'undefined') clearDiv = true;

    if (clearDiv === true) {
        $('#igBotMediaQueueContainer').children().remove();
    } else {
        $('#igBotMediaQueueContainer').children().not('.igBotQueueAcct').remove();
    }

    var c = document.createDocumentFragment();
    for (var i = 0; i < q.length; i++) {
        var u = q[i];

        // already exists in displayed list
        if (document.getElementById('' + u.id + '_container')) continue;

        var newQueueItem = document.createElement("div");
        newQueueItem.id = '' + u.id + '_container';
        newQueueItem.className = 'igBotQueueAcct';

        var newCheckBox = document.createElement("input");
        newCheckBox.setAttribute('type', 'checkbox');
        newCheckBox.id = u.id;
        newCheckBox.value = u.id;
        newCheckBox.className = 'igBotQueueAcctCheckbox';
        newQueueItem.appendChild(newCheckBox);

        var newLabel = document.createElement("label");
        newLabel.setAttribute('for', u.id);

        if (gblOptions.showProfilePicInQueue == true) {
            var newImg = document.createElement("img");
            newImg.className = 'igBotQueueAcctProfilePicture';
            newImg.setAttribute('data-src', u.display_url);
            newLabel.appendChild(newImg);
        }

        newQueueItem.appendChild(newLabel);

        var newLayoutDiv = document.createElement("div");
        newLayoutDiv.className = "igBotQueueAcctNameHolder";

        if (u.owner) {
            var newA = document.createElement("a");
            newA.href = '/' + u.owner.username + '/';
            newA.textContent = u.owner.username;
            newA.className = 'igBotQueueAcctUserName';
            newLayoutDiv.appendChild(newA);
        }

        if (u.location) {
            newAlocation = document.createElement("a");
            newAlocation.href = '/explore/locations/' + u.location.id + '/' + u.location.slug + '/';
            newAlocation.textContent = u.location.name;
            newAlocation.className = 'igBotQueueAcctUserName';
            newLayoutDiv.appendChild(newAlocation);
        }


        if (u.edge_media_to_caption && u.edge_media_to_caption.edges.length > 0) {
            var caption = document.createElement('span');
            caption.className = 'igBotQueueCaption';
            caption.textContent = u.edge_media_to_caption.edges[0].node.text;
            newLayoutDiv.appendChild(caption);
        }


        if (u.edge_media_preview_comment) {
            var counts = document.createElement('span');
            counts.className = 'followerCounts'
            counts.textContent = u.edge_media_preview_comment.count + '  comments | ' + u.edge_media_preview_like.count + ' likes';
            newLayoutDiv.appendChild(counts);
        }


        newQueueItem.appendChild(newLayoutDiv);

        c.appendChild(newQueueItem);

    }

    document.getElementById('igBotMediaQueueContainer').appendChild(c);

}



function handleImagePreload() {
    const images = document.querySelectorAll('#igBotQueueContainer img,#igBotMediaQueueContainer img');
    const config = {
        rootMargin: '0px 0px 50px 0px',
        threshold: 0
    };
    let loaded = 0;

    let observer = new IntersectionObserver(function(entries, self) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                preloadImage(entry.target);
                // Stop watching and load the image
                self.unobserve(entry.target);
            }
        });
    }, config);

    images.forEach(image => {
        if (image.hasAttribute('data-src')) {
            observer.observe(image);
        }
    });

    function preloadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) {
            return;
        }
        img.src = src;
        img.removeAttribute('data-src');
    }

}

function handleCheckBoxes(q) {

    function displaySelectedCount() {
        let boxCheckedCount = 0;
        boxes.forEach(box => {
            if (box.checked == true) boxCheckedCount++;
        });
        document.getElementById('igBotQueueSelectedCount').textContent = '' + boxCheckedCount + ' selected';
    }

    function selectAllCheckBoxes() {
        boxes.forEach(box => {
            if (document.getElementById(box.id).closest('tr').classList.contains('filtered') == false) box.checked = true;
            //box.checked = true;
        });
        displaySelectedCount();
    }

    function selectNoneCheckBoxes() {
        boxes.forEach(box => {
            box.checked = false;
        });
        displaySelectedCount();
    }

    function invertCheckBoxes() {
        boxes.forEach(box => box.checked = !box.checked);
        displaySelectedCount();
    }

    function removeSelected() {
        var useDefaultList = true;

        if (currentList == 'acctsWhiteList' || currentList == 'mediaToLike') {
            useDefaultList = false;
        }

        boxes.forEach(box => {
            if (box.checked) {
                if (useDefaultList == true) {
                    acctsQueue = acctsQueue.filter(u => u.id !== box.value);
                } else if (currentList == 'acctsWhiteList') {
                    acctsWhiteList = acctsWhiteList.filter(u => u.id !== box.value);
                } else if (currentList == 'mediaToLike') {
                    mediaToLike = mediaToLike.filter(m => m.id !== box.value);
                }

                $('#' + box.value + '_container').remove();
            }
        });
        refreshBoxes();
        updateCount();
        displaySelectedCount();

        if (useDefaultList == true) {
            arrayOfUsersToDiv(acctsQueue, true);
        } else if (currentList == 'acctsWhiteList') {
            arrayOfUsersToDiv(acctsWhiteList, true);
        }
    }

    function addAcctsToWhiteList() {
        boxes.forEach(box => {
            if (box.checked) {
                var acct = findAcctById(box.value, acctsQueue);
                addAcctToWhiteList(acct);
            }
        });

        setTimeout(saveWhiteListToStorage, 2000);

        return true;
    }

    function checkIntermediateBoxes(first, second) {
        if (boxes.indexOf(first) > boxes.indexOf(second)) {
            [second, first] = [first, second];
        }
        intermediateBoxes(first, second).forEach(box => box.checked = true);
        // intermediateBoxes(first, second).forEach(box => {
        //     if (document.getElementById(box.value + '_container').style.visibility != 'hidden') {
        //         box.click();
        //     }
        // });
        displaySelectedCount();
    }

    function intermediateBoxes(start, end) {
        return boxes.filter((item, key) => {
            return boxes.indexOf(start) < key && key < boxes.indexOf(end);
        });
    }

    function changeBox(event) {
        if (event.shiftKey && this != lastChecked) {
            checkIntermediateBoxes(lastChecked, this);
        }
        lastChecked = this;
        displaySelectedCount();
    }

    function refreshBoxes() {
        boxes = Array.from(document.querySelectorAll('#igBotQueueContainer [type="checkbox"]'));
    }

    let lastChecked;
    var boxes;

    refreshBoxes();

    boxes.forEach(item => item.addEventListener('click', changeBox));

    $('#btnSelectAll').off('click.selectAllCheckBoxes').on('click.selectAllCheckBoxes', selectAllCheckBoxes);
    $('#btnSelectNone').off('click.selectNoneCheckBoxes').on('click.selectNoneCheckBoxes', selectNoneCheckBoxes);
    $('#btnInvertSelection').off('click.invertCheckBoxes').on('click.invertCheckBoxes', invertCheckBoxes);
    $('#btnRemoveSelected').off('click.removeSelected').on('click.removeSelected', removeSelected);
    $('#btnAddToWhiteList').off('click.addAcctsToWhiteList').on('click.addAcctsToWhiteList', addAcctsToWhiteList);
    $('#btnSaveWhiteList').off('click.saveWhiteListToStorageAndDisk').on('click.saveWhiteListToStorageAndDisk', saveWhiteListToStorageAndDisk);
    $('.close-icon').off('click.filterQueue').on('click.filterQueue', function() {
        setTimeout(filterQueue, 1);
    });
    //$('.igBotInjectedButton').off('click.displaySelectedCount').on('click.displaySelectedCount', displaySelectedCount);

    updateCount();
    displaySelectedCount();
}


function alreadyAttempted(acct) {

    if (typeof acct == 'undefined') return false;

    for (var i = 0; i < acctsPreviouslyAttempted.length; i++) {
        if (acctsPreviouslyAttempted[i].id && acctsPreviouslyAttempted[i].id == acct.id) return acctsPreviouslyAttempted[i];
    }

    return false;
}

function addToAttempted(acct) {

    var acctCopy = acct;

    var d = new Date();
    acctCopy["followAttemptDate"] = '' + d.getTime();

    acctsPreviouslyAttempted.push(acctCopy);
    chrome.storage.local.set({
        acctsAttempted: acctsPreviouslyAttempted
    });
}

function ajaxFollowAllFollowings() {
    acctsQueue = theirFollowings;
    ajaxFollowAll();
}

function ajaxFollowAll() {
    if (acctsQueue.length == 0) {
        printMessage(chrome.i18n.getMessage('QueueEmpty'));
        $('#btnProcessQueue').removeClass('pulsing');
        return false;
    }


    if (checkMaxActionsAndDelayIfNecessary(ajaxFollowAll) == false) {
        ajaxFollowUser(acctsQueue.shift());
    }
}

function removeAcctFromQueueDisplay(id, gray) {
    if (gray === true) {
        $('#igBotQueueContainer #' + id + '_container').css({
            'opacity': '.5'
        });
    } else {
        $('#igBotQueueContainer #' + id + '_container').fadeOut(300, function() {
            $(this).remove();
        });
    }
    updateCount();
}

function updateCount() {
    if (currentList === 'acctsWhiteList') {
        document.getElementById('igBotQueueCount').textContent = '' + acctsWhiteList.length + ' accounts';
    } else {
        document.getElementById('igBotQueueCount').textContent = '' + acctsQueue.length + ' accounts';
    }

    if (acctsQueue.length > 0 || currentList == 'acctsWhiteList') {
        $('#paginationLimitDiv').show();
        $('#paginationLimit option:selected').attr("selected", null);
        $('#paginationLimit option[value="' + gblOptions.paginationLimit + '"]').attr("selected", "selected");

    } else {
        $('#paginationLimitDiv').hide();
    }
}

function addStamp(id, classname, text) {

    if (gblOptions.removeAccountsFromQueue === true) {
        removeAcctFromQueueDisplay(id);
        return false;
    }

    if (gblOptions.showStamps === true) {
        //$('#' + id + '_container label').append('<div class="stamp-div ' + classname + '">' + text + '</div>');
        $('img.igBotQueueAcctProfilePicture[data-ig-userid="' + id + '"]').parent().append('<div class="stamp-div ' + classname + '">' + text + '</div>');
        return true;
    }

    return false;

}

function getRandomizedTime(baseTime) {
    if (gblOptions.useRandomTimeDelay == true) {
        var minRandomTimeDelay = Math.max(0, baseTime - (baseTime * gblOptions.percentRandomTimeDelay));
        var maxRandomTimeDelay = baseTime + (baseTime * gblOptions.percentRandomTimeDelay);
        return getRandomInt(minRandomTimeDelay, maxRandomTimeDelay);
    }
    return baseTime;
}

function usersMediaLoaded(r) {
    var alreadyLiking = false;
    if (mediaToLike.length > 0) alreadyLiking = true;

    var numPicsToLike = parseInt(document.getElementById('numberFollowLikeLatestPics').value);
    if (numPicsToLike > r.data.user.edge_owner_to_timeline_media.edges.length) {
        numPicsToLike = r.data.user.edge_owner_to_timeline_media.edges.length;
    }

    for (var i = 0; i < numPicsToLike; i++) {
        mediaToLike.push(r.data.user.edge_owner_to_timeline_media.edges[i].node);
    }

    if (alreadyLiking === false) likeAllMedia();

}

function ajaxFollowUser(acct) {

    if (gblOptions.autoSaveQueue == true) {
        saveQueueToStorage();
    }


    var promises = [];
    let followable = true;

    if (!acct) {
        outputMessage('no account');
        return false;
    }

    var acctFromStorage = alreadyAttempted(acct);
    var waitTime = getRandomizedTime(gblOptions.timeDelayAfterSkip);
    var acctsQueueNextUsername = '';
    if (acctsQueue.length > 0) {
        acctsQueueNextUsername = acctsQueue[0].username;
    }

    if (gblOptions.followPeopleAlreadyAttempted === false && acctFromStorage !== false) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' already attempted ' + timeToDate(acctFromStorage.followAttemptDate) + ': skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'attempted');
        timeoutsQueue.push(setTimeout(ajaxFollowAll, waitTime));
        return false;
    } else if (acct.followed_by_viewer == true) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' already being followed: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'followed');
        timeoutsQueue.push(setTimeout(ajaxFollowAll, waitTime));
        return false;
    } else if (acct.requested_by_viewer == true) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' already requested: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'requested');
        timeoutsQueue.push(setTimeout(ajaxFollowAll, waitTime));
        return false;
    } else if (acct.is_private == true && gblOptions.followPrivateAccounts != true) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' is private: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'private');
        timeoutsQueue.push(setTimeout(ajaxFollowAll, waitTime));
        return false;
    } else if (gblOptions.filterOptions.applyFiltersAutomatically == true) {
        promises.push(filterCriteriaMet(acct).then((met) => {
            if (met == false) {
                followable = false;
            }
        }));
    }

    Promise.all(promises).then(function() {

        if (followable === false) {
            acctsProcessed.push(acct);
            outputMessage(acct.username + ' did not match your filters: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
            addStamp(acct.id, 'stamp-div-grey', 'filtered');
            if (noAcctsLeft()) return false;
            printMessage(' ');
            timeoutsQueue.push(setTimeout(ajaxFollowAll, waitTime));
            return false;
        }

        waitTime = getRandomizedTime(gblOptions.timeDelay);

        $.ajax({
                url: 'https://www.instagram.com/web/friendships/' + acct.id + '/follow/',
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                    xhr.setRequestHeader('x-asbd-id', '198387');
                    xhr.setRequestHeader('x-ig-app-id', '936619743392459');
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function() {

                acctsProcessed.push(acct);
                actionsTaken++;
                addStamp(acct.id, 'stamp-div-green', 'followed');
                addToAttempted(acct);

                outputMessage('Followed ' + acct.username + ' (' + acct.id + ') | ' + acctsProcessed.length + ' processed;  waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
                timeoutsQueue.push(setTimeout(ajaxFollowAll, waitTime));

                // console.log(waitTime);
                // console.log(timeoutsQueue);

                if (document.getElementById('radioFollowAndLike').checked == true) {
                    ajaxLoadUsersMedia('', false, usersMediaLoaded, acct.id);
                }

            })
            .fail(function(data) {
                acctsQueue.unshift(acct);
                if (data.status == 404) {

                } else if (data.status == 403) {
                    printMessage(chrome.i18n.getMessage('RateLimitSoft', [(gblOptions.timeDelayAfterSoftRateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(ajaxFollowAll, gblOptions.timeDelayAfterSoftRateLimit));
                } else if (data.status == 400) {
                    if (data.responseJSON && data.responseJSON.message) {
                        if (data.responseJSON.feedback_title) {
                            outputMessage(data.responseJSON.feedback_title);
                        }

                        if (data.responseJSON.feedback_url) {
                            outputMessage(data.responseJSON.feedback_url);
                        }

                        if (data.responseJSON.feedback_message) {
                            if (data.responseJSON.feedback_message.indexOf('blocked') > -1) {
                                outputMessage('Message from Instagram (*NOT* Growbot): ' + data.responseJSON.feedback_message);
                            }
                        }
                        // check if they are at the max
                        if (data.responseJSON.message.indexOf('max') > -1) {
                            $('#btnProcessQueue').removeClass('pulsing');
                            alert(data.responseJSON.message);
                            alert('If you have reached the maximum number of following, please note that pending follow requests on private accounts are counted by instagram as following.  You can see your pending requests by clicking the Load Pending Follow Requests button.');
                            return false;
                        }
                    }

                    printMessage(chrome.i18n.getMessage('RateLimitHard', [(gblOptions.timeDelayAfterHardRateLimit / 3600000)]));
                    timeoutsQueue.push(setTimeout(ajaxFollowAll, gblOptions.timeDelayAfterHardRateLimit));
                } else if (data.status == 429) {
                    printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(ajaxFollowAll, gblOptions.timeDelayAfter429RateLimit));
                } else {
                    outputMessage(data.status + ' error, trying again in 5 seconds');
                    timeoutsQueue.push(setTimeout(ajaxFollowAll, 5000));
                }
            });
    });
}



function ajaxLikeAllPostsFromHashtag(after) {

    if (typeof after != 'string') after = '';

    var hashtag = getHashtagFromUrl();

    if (hashtag == '') {
        outputMessage('Error - not on hashtag page');
        return false;
    }

    var jsonvars = {
        "tag_name": hashtag,
        "first": 128
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var count = 50;

    if (!isNaN(document.getElementById('numberToLikeHashtag').value)) {
        count = document.getElementById('numberToLikeHashtag').value;
    }

    var url = 'https://www.instagram.com/graphql/query/?query_hash=9b498c08113f1e09617a1703c22b2f32&variables=' + encodeURIComponent(urljsonvars);

    document.getElementById('btnLikeHashtag').classList.add('pulsing');

    $.ajax(url)
        .done(function(r) {
            if (r.data.hashtag) {
                for (var i = 0; i < r.data.hashtag.edge_hashtag_to_media.edges.length; i++) {
                    mediaToLike.push(r.data.hashtag.edge_hashtag_to_media.edges[i].node);
                }
                if (r.data.hashtag.edge_hashtag_to_media.page_info.has_next_page == true) {
                    after = r.data.hashtag.edge_hashtag_to_media.page_info.end_cursor;
                }
            } else {
                printMessage(' ');
                printMessage(' ');

                outputMessage('Error liking hashtag - please report to growbotautomator@gmail.com');
                printMessage(' ');
                printMessage(' ');
            }

            if (after != '' && mediaToLike.length < count) {
                outputMessage(mediaToLike.length + ' media out of ' + count + ' loaded to queue for liking')
                timeoutsQueue.push(setTimeout(function() {
                    ajaxLikeAllPostsFromHashtag(after);
                }, 500));
            } else {
                if (mediaToLike.length > count) mediaToLike = mediaToLike.slice(0, count);
                likeAllMedia();
            }

        });
}


function allNodes(obj, key, array) {
    array = array || [];
    if ('object' === typeof obj) {
        for (let k in obj) {
            if (k === key) {
                array.push(obj[k]);
            } else {
                allNodes(obj[k], key, array);
            }
        }
    }
    return array;
}

function uniq(arr) {


    const ids = arr.map(o => o.id)
    const filtered = arr.filter(({
        id
    }, index) => !ids.includes(id, index + 1))

    return filtered;

}


function ajaxLoadPostersFromHashtag(after) {

    if (!after.page) after = {};

    var hashtag = getHashtagFromUrl();

    if (hashtag == '') {
        outputMessage('Error - not on hashtag page');
        return false;
    }

    document.getElementById('btnLoadHashtagPosters').classList.add('pulsing');

    $.ajax({
            url: 'https://i.instagram.com/api/v1/tags/' + hashtag + '/sections/',
            data: after,
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
                xhr.setRequestHeader('x-asbd-id', '198387');
                xhr.setRequestHeader('x-ig-app-id', '936619743392459');
            },
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function(data) {

            var tmpQueue = [];

            var medias = allNodes(data, 'media');
            for (var i = 0; i < medias.length; i++) {
                var u = medias[i].user;
                u.id = u.pk;
                acctsQueue.push(u);
                tmpQueue.push(u);
            }

            // this would allow loading commenters and likers as well
            //var users = allNodes(data, 'user');
            // for (var i = 0; i < users.length; i++) {
            //     var u = users[i];
            //     u.id = u.pk;
            //     acctsQueue.push(u);
            //     tmpQueue.push(u);
            // }

            tmpQueue = uniq(tmpQueue);
            acctsQueue = uniq(acctsQueue);

            //arrayOfUsersToDiv(tmpQueue, false);

            if (data.more_available == true && (acctsQueue.length < parseInt(gblOptions.maxAcctQueueLength) || gblOptions.limitQueue !== true)) {
                printMessage(chrome.i18n.getMessage('AccountsLoaded', [tmpQueue.length, acctsQueue.length]));

                after = {
                    "max_id": data.next_max_id,
                    "page": data.next_page,
                    "next_media_ids": data.next_media_ids,
                    "tab": "recent",
                    "surface": "grid",
                    "include_persistent": 0
                }

                timeoutsQueue.push(setTimeout(function() {
                    ajaxLoadPostersFromHashtag(after);
                }, 200));
            } else {
                truncateQueue(gblOptions.truncateStart);

                $('#btnLoadHashtagPosters').removeClass('pulsing');

                arrayOfUsersToDiv(acctsQueue, true);

                printMessage(chrome.i18n.getMessage('Done'));
                printMessage(' ');
            }


        }).fail(function(f) {
            if (f.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(function() {
                    ajaxLoadPostersFromHashtag(after);
                }, gblOptions.timeDelayAfter429RateLimit));
            }
        });

}

function ajaxLikeAllPostsFromFeed(after) {

    if (typeof after != 'string') after = '';

    var jsonvars = {
        "fetch_media_item_count": 24,
        "fetch_comment_count": 4,
        "fetch_like": 10,
        "has_stories": false
    }

    if (after != '') {
        jsonvars.fetch_media_item_cursor = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var count = 50;
    if (!isNaN(document.getElementById('numberToLike').value)) {
        count = document.getElementById('numberToLike').value;
    }


    var url = 'https://www.instagram.com/graphql/query/?query_hash=615767824d774172a86e99cbaca97512&variables=' + encodeURIComponent(urljsonvars);

    document.getElementById('btnLikeFeed').classList.add('pulsing');

    $.ajax(url)
        .done(function(r) {
            if (r.data.user) {
                for (var i = 0; i < r.data.user.edge_web_feed_timeline.edges.length; i++) {
                    mediaToLike.push(r.data.user.edge_web_feed_timeline.edges[i].node);
                }
                if (r.data.user.edge_web_feed_timeline.page_info.has_next_page == true) {
                    after = r.data.user.edge_web_feed_timeline.page_info.end_cursor;
                }
            } else {
                printMessage(' ');
                printMessage(' ');

                outputMessage('Error liking feed - please report to growbotautomator@gmail.com');
                printMessage(' ');
                printMessage(' ');
            }

            if (after != '' && mediaToLike.length < count) {
                outputMessage(mediaToLike.length + ' media out of ' + count + ' loaded to queue for liking')
                timeoutsQueue.push(setTimeout(function() {
                    ajaxLikeAllPostsFromFeed(after);
                }, 500));
            } else {
                if (mediaToLike.length > count) mediaToLike = mediaToLike.slice(0, count);
                likeAllMedia();
            }

        });
}

function likeAllMedia() {
    if (gblOptions.showLikesInQueue === true) {
        // if (queueSplit === false) {
        //     queueSplit = Split(['#igBotQueueContainer', '#igBotMediaQueueContainer'], { sizes: [55, 45], gutterSize: 20, minSize: 0 }); // split.js
        // }
        arrayOfMediaToDiv(mediaToLike, false);
        handleImagePreload();
        handleCheckBoxes(mediaToLike);
    }

    if (mediaToLike.length == 0) {
        outputMessage('Finished liking media');
        $('#btnLikeFeed,#btnLikeHashtag').removeClass('pulsing');
        return false;
    }

    var media = mediaToLike.pop();
    var id = media.id;

    for (var i = 0; i < previousLikes.length; i++) {
        if (id == previousLikes[i]) {
            outputMessage('Already liked, moving on...');
            addStamp(media.id, 'stamp-div-grey', 'skipped');

            timeoutsQueue.push(setTimeout(likeAllMedia, 1));
            return false;
        }
    }

    likeMedia(media);
}

function likeMedia(media) {
    $.ajax({
            url: 'https://www.instagram.com/web/likes/' + media.id + '/like/',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
                xhr.setRequestHeader('x-asbd-id', '198387');
                xhr.setRequestHeader('x-ig-app-id', '936619743392459');
            },
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function() {
            previousLikes.push(media.id);

            savePreviousLikesToStorage();

            outputMessage('Like successful, ' + mediaToLike.length + ' pending');

            addStamp(media.id, 'stamp-div-green', 'liked');


            var waitTime = getRandomizedTime(gblOptions.timeDelay);

            if (mediaToLike.length > 0) {
                outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to Like next');
                timeoutsQueue.push(setTimeout(likeAllMedia, waitTime));
            }

        })
        .fail(function(data) {
            mediaToLike.push(media);
            if (data.status == 403) {
                printMessage(chrome.i18n.getMessage('RateLimitSoft', [(gblOptions.timeDelayAfterSoftRateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(likeAllMedia, gblOptions.timeDelayAfterSoftRateLimit));
            } else if (data.status == 400) {
                printMessage(chrome.i18n.getMessage('RateLimitHard', [(gblOptions.timeDelayAfterHardRateLimit / 3600000)]));
                timeoutsQueue.push(setTimeout(likeAllMedia, gblOptions.timeDelayAfterHardRateLimit));
            } else if (data.status == 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                timeoutsQueue.push(setTimeout(likeAllMedia, gblOptions.timeDelayAfter429RateLimit));
            } else {
                outputMessage(data.status + ' error, trying again in 5 seconds');
                timeoutsQueue.push(setTimeout(likeAllMedia, 5000));
            }
        });
}

async function populateAllQueueUsersInfo(q) {
    for (var i = 0; i < q.length; i++) {
        q[i] = await getAdditionalDataForAcct(q[i]);
        printMessage(chrome.i18n.getMessage('DataLoaded', [(i + 1), q.length]));
        if (q[i].assumedDeleted) {
            q.slice(i, 1);
        }
    }
    arrayOfUsersToDiv(q, true);
    $('#btnLoadHashtagPosters').removeClass('pulsing');

    if (window.confirm(chrome.i18n.getMessage('FinishedAdditionalData'))) {
        saveQueueToStorageAndDisk();
    }
}

function maxActionsExceeded() {
    if (gblOptions.maxPerEnabled == true && (actionsTaken >= gblOptions.maxPerActions)) {
        var todaysdate = new Date();
        maxActionsDelayStartTime = todaysdate.getTime();

        return true;
    }
    return false;
}

function maxActionsDelayRemaining() {
    var todaysdate = new Date();
    var today = todaysdate.getTime();
    var timeSinceActionsMaxed;
    timeSinceActionsMaxed = today - maxActionsDelayStartTime;

    return (gblOptions.maxPerPeriod - timeSinceActionsMaxed);
}

function checkMaxActionsAndDelayIfNecessary(callback) {
    if (maxActionsExceeded() && maxActionsDelayRemaining() > 0) {
        timeoutsQueue.push(setTimeout(callback, maxActionsDelayRemaining()));
        outputMessage('Max actions exceeded, waiting ' + millisecondsToHumanReadable(maxActionsDelayRemaining(), true))

        actionsTaken = 0;

        return true;
    }

    return false;
}


function ajaxRemoveOrBlockAll() {
    if (checkMaxActionsAndDelayIfNecessary(ajaxRemoveOrBlockAll) == false) {
        ajaxRemoveOrBlockAcct(acctsQueue.pop());
    }
}

function ajaxUnfollowAll() {
    if (checkMaxActionsAndDelayIfNecessary(ajaxUnfollowAll) == false) {
        ajaxUnfollowAcct(acctsQueue.pop());
    }
}

function quickUnfollowAcct(acct) {
    $.ajax({
            url: 'https://www.instagram.com/web/friendships/' + acct.id + '/unfollow/',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
                xhr.setRequestHeader('x-asbd-id', '198387');
                xhr.setRequestHeader('x-ig-app-id', '936619743392459');
            },
            xhrFields: {
                withCredentials: true
            }
        })
        .done(function() {
            outputMessage('Unfollowed ' + acct.username + ' (' + acct.id + ') using button');
            $('.igBotInjectedLinkWhitelist[data-username="' + acct.username + '"]').parents('article').fadeOut();
        })
        .fail(function(data) {
            if (data.status == 403) {
                alert('soft rate limit encountered, failed to unfollow ' + acct.username);
            } else if (data.status == 400) {
                alert('hard rate limit encountered, failed to unfollow ' + acct.username);
            } else {
                alert('Error ' + data.status + ', failed to unfollow ' + acct.username);
            }
        })
}

function ajaxUnfollowAcct(acct) {
    if (gblOptions.autoSaveQueue == true) {
        saveQueueToStorage();
    }

    var promises = [];
    let unfollowable = true;

    var waitTime = getRandomizedTime(gblOptions.timeDelayAfterSkip);

    if (typeof acct == 'undefined') {
        noAcctsLeft();
        return false;
    }

    if (containsObject(acct, acctsWhiteList) == true) {
        outputMessage(acct.username + ' is whitelisted, skipping');
        addStamp(acct.id, 'stamp-div-grey', 'whitelisted');
        acctsProcessed.push(acct);
        setTimeout(ajaxUnfollowAll, 1);
        return false;
    }


    if (gblOptions.dontUnFollowNonGrowbot === true) {
        var acctFromStorage = alreadyAttempted(acct);
        if (acctFromStorage === false) {
            outputMessage(acct.username + ' was followed outside of Growbot, skipping');
            addStamp(acct.id, 'stamp-div-grey', 'non-growbot');
            acctsProcessed.push(acct);
            setTimeout(ajaxUnfollowAll, 1);
            return false;
        }
    }

    if (gblOptions.dontUnFollowFilters == true || gblOptions.dontUnFollowFollowers == true || gblOptions.unFollowIfOld == true) {
        promises.push(filterCriteriaMetForUnfollowing(acct).then((met) => {
            if (met == false) {
                unfollowable = false;
            }
        }));
    }

    Promise.all(promises).then(function() {
        if (unfollowable === false) {
            acctsProcessed.push(acct);
            outputMessage(acct.username + ' skipped (matches your filters)');
            addStamp(acct.id, 'stamp-div-grey', 'matches filters');

            if (noAcctsLeft()) {
                return false;
            } else {
                outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to unfollow ' + acctsQueue[acctsQueue.length - 1].username);
                timeoutsQueue.push(setTimeout(ajaxUnfollowAll, waitTime));
                return false;
            }
        }

        waitTime = getRandomizedTime(gblOptions.timeDelay);

        $.ajax({
                url: 'https://www.instagram.com/web/friendships/' + acct.id + '/unfollow/',
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                    xhr.setRequestHeader('x-asbd-id', '198387');
                    xhr.setRequestHeader('x-ig-app-id', '936619743392459');
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function() {

                acctsProcessed.push(acct);
                actionsTaken++;
                addStamp(acct.id, 'stamp-div-green', 'unfollowed');

                outputMessage('Unfollowed ' + acct.username + ' (' + acct.id + ') | ' + acctsProcessed.length + ' processed, ' + acctsQueue.length + ' left to go');


                if (noAcctsLeft()) {
                    return false;
                } else {
                    outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to unfollow ' + acctsQueue[acctsQueue.length - 1].username);
                    timeoutsQueue.push(setTimeout(ajaxUnfollowAll, waitTime));
                }

            })
            .fail(function(data) {
                acctsQueue.push(acct);
                if (data.status == 403) {
                    printMessage(chrome.i18n.getMessage('RateLimitSoft', [(gblOptions.timeDelayAfterSoftRateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(ajaxUnfollowAll, gblOptions.timeDelayAfterSoftRateLimit));
                } else if (data.status == 400) {
                    printMessage(chrome.i18n.getMessage('RateLimitHard', [(gblOptions.timeDelayAfterHardRateLimit / 3600000)]));
                    timeoutsQueue.push(setTimeout(ajaxUnfollowAll, gblOptions.timeDelayAfterHardRateLimit));
                } else if (data.status == 429) {
                    printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(ajaxUnfollowAll, gblOptions.timeDelayAfter429RateLimit));
                } else {
                    outputMessage(data.status + ' error, trying again in 5 seconds');
                    timeoutsQueue.push(setTimeout(ajaxUnfollowAll, 5000));
                }
            })
    });

}

function ajaxRemoveOrBlockAcct(acct) {
    if (gblOptions.autoSaveQueue == true) {
        saveQueueToStorage();
    }

    var promises = [];
    let removable = true;

    var waitTime = getRandomizedTime(gblOptions.timeDelayAfterSkip);

    if (typeof acct == 'undefined') {
        noAcctsLeft();
        return false;
    }

    if (containsObject(acct, acctsWhiteList) == true) {
        outputMessage(acct.username + ' is whitelisted, skipping');
        addStamp(acct.id, 'stamp-div-grey', 'whitelisted');
        acctsProcessed.push(acct);
        setTimeout(ajaxRemoveOrBlockAll, 1);
        return false;
    }

    if (gblOptions.dontRemoveOrBlockFilters == true) {
        promises.push(filterCriteriaMetForRemoveOrBlock(acct).then((met) => {
            if (met == false) {
                removable = false;
            }
        }));
    }

    Promise.all(promises).then(function() {

        var removeOrBlockEndpoint = '/remove_follower/';
        var removeOrBlockString = 'Remove';
        var removedOrBlockedString = 'Removed';


        if (document.getElementById('radioBlock').checked === true) {
            removeOrBlockEndpoint = '/block/';
            removeOrBlockString = 'Block'
            removedOrBlockedString = 'Blocked';
        }

        if (removable === false) {
            acctsProcessed.push(acct);

            outputMessage(acct.username + ' skipped (matches your filters)');
            addStamp(acct.id, 'stamp-div-grey', 'matches filters');


            if (noAcctsLeft()) {
                return false;
            } else {
                outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to ' + removeOrBlockString + ' ' + acctsQueue[acctsQueue.length - 1].username);
                timeoutsQueue.push(setTimeout(ajaxRemoveOrBlockAll, waitTime));
                return false;
            }
        }

        waitTime = getRandomizedTime(gblOptions.timeDelay);

        $.ajax({
                url: 'https://www.instagram.com/web/friendships/' + acct.id + removeOrBlockEndpoint,
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                    xhr.setRequestHeader('x-asbd-id', '198387');
                    xhr.setRequestHeader('x-ig-app-id', '936619743392459');
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function() {
                acctsProcessed.push(acct);
                actionsTaken++;
                addStamp(acct.id, 'stamp-div-green', removedOrBlockedString);

                outputMessage(removedOrBlockedString + ' ' + acct.username + ' (' + acct.id + ') | ' + acctsProcessed.length + ' processed, ' + acctsQueue.length + ' left to go');

                if (noAcctsLeft()) {
                    return false;
                } else {
                    outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to ' + removeOrBlockString + ' ' + acctsQueue[acctsQueue.length - 1].username);
                    timeoutsQueue.push(setTimeout(ajaxRemoveOrBlockAll, waitTime));
                }

            })
            .fail(function(data) {
                acctsQueue.push(acct);
                if (data.status == 403) {
                    printMessage(chrome.i18n.getMessage('RateLimitSoft', [(gblOptions.timeDelayAfterSoftRateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(ajaxRemoveOrBlockAll, gblOptions.timeDelayAfterSoftRateLimit));
                } else if (data.status == 400) {
                    printMessage(chrome.i18n.getMessage('RateLimitHard', [(gblOptions.timeDelayAfterHardRateLimit / 3600000)]));
                    timeoutsQueue.push(setTimeout(ajaxRemoveOrBlockAll, gblOptions.timeDelayAfterHardRateLimit));
                } else if (data.status == 429) {
                    printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(ajaxRemoveOrBlockAll, gblOptions.timeDelayAfter429RateLimit));
                } else {
                    outputMessage(data.status + ' error, trying again in 5 seconds');
                    timeoutsQueue.push(setTimeout(ajaxRemoveOrBlockAll, 5000));
                }
            })
    });

}

function noAcctsLeft() {
    if (acctsQueue.length === 0) {
        outputMessage('No accounts left!');
        $('#btnProcessQueue').removeClass('pulsing');
        return true;
    }
    return false;
}

function injectIcon() {
    var imgURL = chrome.runtime.getURL("icon_48.png");

    $('#instabotIcon').remove();

    // if ($('._acus').length > 0) {
    //     $('._acus').append('<div class="_acut"><div class="_acrd"><div id="instabotIcon"></div></div></div>');
    //     $('#instabotIcon').css({ 'margin': '-4px 0px 0px 5px', 'position': 'absolute', });
    // } else if (window.location.href.indexOf('/stories/') == -1) {
    $('body').prepend('<div id="instabotIcon"></div>');
    $('#instabotIcon').css({
        'top': '0px',
        'right': '0px'
    });
    //}


    $('#instabotIcon').css({
        'background-image': 'url("' + imgURL + '")'
    }).click(toggleControlsDiv);
}

function injectVersionNumber() {
    document.getElementById('igBotExtensionVersion').textContent = chrome.runtime.getManifest().version;
    document.getElementById('h1GrowbotHeading').textContent = 'GrowBot Automator ' + chrome.runtime.getManifest().version + ' for Instagram™ — Cracked by Yezer';
}

function hideControlsDiv() {
    toggleControlsDiv();
    shakeInstabotIcon();
}

function shakeInstabotIcon() {
    $('#instabotIcon').shake(50, 2, 8);
}

function toggleControlsDiv() {
    $('#igBotInjectedContainer').toggle({
        effect: "scale",
        direction: "both",
        origin: ["top", "center"],
        done: function() {
            var isVisible = $('#igBotInjectedContainer').is(":visible");
            saveHiddenStatus(!isVisible);
        }
    });
}

function openControlsDiv() {
    var isVisible = $('#igBotInjectedContainer').is(":visible");
    if (isVisible == false) {
        toggleControlsDiv();
    }
}

function injectControlsDiv() {
    $('#igBotInjectedContainer').remove();

    $.get(chrome.runtime.getURL('growbot.html'), function(data) {
        $('body').prepend($.parseHTML(data));
        localizeExtension();

        chrome.storage.local.get("growbotLog", function(data) {
            if (typeof data.growbotLog != 'undefined') {
                var logFromStorage = data.growbotLog;
                var fakeConsole = document.getElementById('txtConsole');
                fakeConsole.textContent = logFromStorage + '\n\n';
                fakeConsole.scrollTop = fakeConsole.scrollHeight;
                includeLogInMailToLinks();
            }
        });

        bindEvents();
        loadOptions();
        loadWhiteList();
        loadPreviousAttempts();
        injectVersionNumber();
        ready(igExternalVars.qsForConvenienceButtons, function(element) {
            addNewConvenienceLinks(element);
        });
        getHiddenStatus(hiddenStatusCallback);


        setTimeout(function() {
            if (gblOptions.loadQueueOnStartup == true) {
                loadQueueFromLocal();
            }
        }, 1000);

    });
}

function localizeExtension() {
    $('#igBotInjectedContainer [localeMessage]').each(function() {
        $(this).text(chrome.i18n.getMessage($(this).attr('localeMessage')));
    });

    $('#igBotInjectedContainer [localeReplaceString]').each(function() {
        $(this).text($(this).text().replace($(this).attr('localeReplaceString'), chrome.i18n.getMessage($(this).attr('localeReplaceString').replace(/ /g, '_'))));
    });
}

function buildMessagesJson() {
    var jsonbuilder = '';

    $('#igBotInjectedContainer [localeMessage]').each(function() {
        var titlestr = '';
        if ($(this).attr('title')) {
            titlestr = ', "title": "' + $(this).attr('title') + '"';
        }
        var str2add = '"' + $(this).attr('localeMessage') + '": { "message": "' + $(this).html() + '"' + titlestr + '},'
        if (jsonbuilder.indexOf(str2add) == -1) jsonbuilder = jsonbuilder + str2add;

        if ($(this).html() == '') {
            alert($(this).attr('localeMessage'));
        }
    });

    //console.log(jsonbuilder);

}

(function(win) {
    'use strict';

    var listeners = [],
        doc = win.document,
        MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
        observer;

    function ready(selector, fn) {
        // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn
        });
        if (!observer) {
            // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true
            });
        }
        // Check if the element is currently in the DOM
        check();
    }

    function check() {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    }

    // Expose `ready`
    win.ready = ready;

})(this);



function ajaxLikeAll() {
    if (noAcctsLeft() == false) {
        getUsersMedia(acctsQueue.shift());
    }
}

function getUsersMedia(acct) {

    var acctsQueueNextUsername = '';
    removeAcctFromQueueDisplay(acct.id, true);
    if (noAcctsLeft() === false) {
        acctsQueueNextUsername = acctsQueue[0].username;
    }

    ajaxLoadUsersMedia('', false, usersMediaLoaded, acct.id);

    var waitTime = getRandomizedTime(gblOptions.timeDelay);

    outputMessage('Adding media for ' + acct.username + ' (' + acct.id + ') to like queue;  waiting  ' + (waitTime / 1000) + ' seconds to process ' + acctsQueueNextUsername);
    timeoutsQueue.push(setTimeout(ajaxLikeAll, waitTime));
}

function initProcessQueue() {
    var todaysdate = new Date();
    maxActionsDelayStartTime = todaysdate.getTime();

    $('#btnProcessQueue').addClass('pulsing');

    if (document.getElementById('radioFollow').checked === true || document.getElementById('radioFollowAndLike').checked === true) {
        ajaxFollowAll();
    } else if (document.getElementById('radioUnFollow').checked === true) {
        initUnfollowMyFollowers();
    } else if (document.getElementById('radioLikeOnly').checked === true) {
        ajaxLikeAll();
    } else if (document.getElementById('radioBlock').checked === true || document.getElementById('radioRemoveFromFollowers').checked === true) {
        ajaxRemoveOrBlockAll();
    } else if (document.getElementById('radioGetMoreData').checked === true) {
        populateAllQueueUsersInfo(acctsQueue);
    }
}

function bindEvents() {

    $('#igBotInjectedContainer #btnProcessQueue').click(initProcessQueue);

    $('#igBotInjectedContainer input[type="checkbox"], #igBotInjectedContainer select').off('change.checkboxSaveOptions').on('change.checkboxSaveOptions', saveOptions);
    $('#igBotInjectedContainer input[type="text"],#igBotInjectedContainer input[type="number"]').bind('keyup input', saveOptions);
    $('details').off('toggle.detailsToggle').on('toggle.detailsToggle', saveOptions);

    $('#igBotInjectedContainer #btnStop').click(function() {
        for (var i = 0; i < timeoutsQueue.length; i++) {
            clearTimeout(timeoutsQueue[i]);
        }

        timeoutsQueue = [];

        $('#igBotInjectedContainer *').removeClass('pulsing');
        outputMessage('Stopped all pending actions');
    });

    $('#igBotInjectedContainer #btnLikeFeed').click(ajaxLikeAllPostsFromFeed).children().click(function(e) {
        return false;
    });

    $('#btnLoadHashtagPosters').off('click.ajaxLoadPostersFromHashtag').on('click.ajaxLoadPostersFromHashtag', ajaxLoadPostersFromHashtag);
    $('#btnLoadPendingRequests').click(ajaxGetPendingFollowRequests);
    $('#btnLoadSavedQueue').click(loadSavedQueue);
    $('#btnViewWhiteList').click(viewWhiteList);
    $('#btnSaveQueueToStorage').click(saveQueueToStorageAndDisk);

    if (getCurrentPageUsername() != '') {
        setCurrentPageUsername();
    } else {
        $('#igBotInjectedContainer #btnGetAllUsersFollowers').off('click.setCurrentPageUsername').on('click.setCurrentPageUsername', setCurrentPageUsername);
        $('#igBotInjectedContainer #btnGetAllUsersFollowing').off('click.setCurrentPageUsername').on('click.setCurrentPageUsername', setCurrentPageUsername);
    }

    setCurrentPageHashtag();


    $('#btnApplyFilter').off('click.ApplyFilter').on('click.ApplyFilter', function() {
        $('li.tab1').click();
        applyFiltersManually();
    });

    $('#btnFindSubscription').off('click.relinkSubscription').on('click.relinkSubscription', relinkSubscription);

    $('#igBotMediaQueueContainer').off('click.setCurrentList').on('click.setCurrentList', function() {
        currentList = 'mediaToLike';
    });
    $('#igBotQueueContainer').off('click.setCurrentList').on('click.setCurrentList', function() {
        if (currentList != 'acctsWhiteList') {
            currentList = 'acctsQueue';
        }
    });


    $(document).on('click.convenienceUnFollow', 'a.igBotInjectedLinkUnfollow', function() {
        $(this).off('click.convenienceUnFollow').css({
            "color": "white"
        }).append('<div class="igBotLoader"></div>');
        convenienceLinkUnfollowAcct($(this).attr('data-username'));
    });

    $(document).on('click.convenienceWhitelist', 'a.igBotInjectedLinkWhitelist', function() {
        $(this).off('click.convenienceWhitelist').css({
            "color": "white"
        }).append('<div class="igBotLoader"></div>');
        convenienceLinkWhitelistAcct($(this).attr('data-username'));
    });
}

async function applyFiltersManually() {

    if (isAdditionalDataFullyLoaded(acctsQueue) === false && acctsQueue.length > 50 && gblOptions.useTimeDelayAfterAdditionalInfo == false) {
        if (!window.confirm('Applying filters requires loading additional data about each account.\n\nLoading this data can trigger rate limits from instagram.\n\nYou should strongly consider setting a delay in the Settings.\n\nProceed with filtering anyway?')) {
            return false;
        }
    }

    for (let i = acctsQueue.length - 1; i > -1; i--) {
        if (await filterCriteriaMet(acctsQueue[i]) === false) {
            outputMessage(acctsQueue[i].username + ' removed from queue (did not match your filters)');
            addStamp(acctsQueue[i].id, 'stamp-div-grey', 'removed');
            acctsQueue.splice(i, 1);
        }
    }

    outputMessage('Filters applied.');
    if (window.confirm('Filters applied.  Save queue now?')) saveQueueToStorageAndDisk();

}

function getAdditionalDataForAcct(a, urlprefix) {
    if (!urlprefix) urlprefix = urlAcctInfo;
    return new Promise(function(resolve, reject) {

        if (a.edge_followed_by) {
            a = appendFollowersRatioToAcct(a);
            a = appendLastPostDateToAcct(a);
            resolve(a);
            return a;
        }

        $.ajax({
                url: '' + urlprefix + a.username,
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                    xhr.setRequestHeader('x-asbd-id', '198387');
                    xhr.setRequestHeader('x-ig-app-id', '936619743392459');
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function(r) {
                var u = extractJSONfromUserPageHTML(r);

                if (u == false) {
                    resolve(getAdditionalDataForAcct(a, urlAcctInfo2));
                    return false;
                }

                a = u;

                // if (document.getElementById(u.id + '_container')) {
                //     var igBotQueueAcctNameHolder = document.getElementById(u.id + '_container').getElementsByClassName('igBotQueueAcctNameHolder')[0];

                //     var newA = igBotQueueAcctNameHolder.getElementsByClassName('igBotQueueAcctUserName')[0];
                //     if (u.is_private && u.is_private == true) {
                //         var iconPrivate = document.createElement('span');
                //         iconPrivate.className = 'iconPrivate';
                //         newA.appendChild(iconPrivate);
                //     }
                //     newA.title = u.biography || '';

                //     var counts = document.createElement('span');
                //     counts.className = 'followerCounts'
                //     counts.textContent = u.edge_followed_by.count + ' | ' + u.edge_follow.count + ' | ' + u.edge_owner_to_timeline_media.count;
                //     counts.title = u.edge_followed_by.count + ' followers | ' + u.edge_follow.count + ' following' + ' | ' + u.edge_owner_to_timeline_media.count + ' posts';

                //     igBotQueueAcctNameHolder.appendChild(counts);
                // }

                outputMessage('Loaded additional data for ' + a.username);

                a = appendFollowersRatioToAcct(a);
                a = appendLastPostDateToAcct(a);

                if (gblOptions.useTimeDelayAfterAdditionalInfo == true) {
                    setTimeout(function() {
                        resolve(a);
                    }, gblOptions.timeDelayAfterAdditionalInfo);
                    printMessage(chrome.i18n.getMessage('TimeDelay', [(gblOptions.timeDelayAfterAdditionalInfo / 1000)]));
                    timeoutsQueue.push(setTimeout(function() {
                        resolve(a);
                    }, gblOptions.timeDelayAfterAdditionalInfo));
                } else {
                    resolve(a);
                }

                gbl404attempt = 0;

            }).fail(function(data) {
                if (data.status == 403) {
                    printMessage(chrome.i18n.getMessage('RateLimitSoft', [(gblOptions.timeDelayAfterSoftRateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, gblOptions.timeDelayAfterSoftRateLimit));
                } else if (data.status == 400) {
                    printMessage(chrome.i18n.getMessage('RateLimitHard', [(gblOptions.timeDelayAfterHardRateLimit / 3600000)]));
                    timeoutsQueue.push(setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, gblOptions.timeDelayAfterHardRateLimit));
                } else if (data.status == 429) {
                    printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                    timeoutsQueue.push(setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, gblOptions.timeDelayAfter429RateLimit));
                } else if (data.status == 404) {
                    gbl404attempt++;
                    if (gbl404attempt < 11) {
                        outputMessage('404 possible rate limit, trying again in 1 minute (attempt ' + gbl404attempt + ' of 10)');
                        timeoutsQueue.push(setTimeout(function() {
                            resolve(getAdditionalDataForAcct(a));
                        }, 60000));
                        return false;
                    } else {
                        outputMessage('404 account assumed missing after 10 attempts');
                        a.assumedDeleted = true;
                        resolve(a);
                    }
                } else {
                    outputMessage('' + data.status + ' error, trying again in 5 seconds');
                    timeoutsQueue.push(setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, 5000));
                }
                gbl404attempt = 0;
            });
    });
}


async function filterCriteriaMet(acct) {

    var filtered = false;

    if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) > -1 && gblOptions.filterOptions.no_profile_pic == false) {
        outputMessage(acct.username + ' filtered - has no profile picture')
        filtered = true;
    }

    if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) == -1 && gblOptions.filterOptions.profile_pic == false) {
        outputMessage(acct.username + ' filtered - has profile picture')
        filtered = true;
    }

    if (acct.followed_by_viewer == true && gblOptions.filterOptions.followed_by_me == false) {
        outputMessage(acct.username + ' filtered - account is followed by you')
        filtered = true;
    }

    if (acct.followed_by_viewer == false && gblOptions.filterOptions.non_followed_by_me == false) {
        outputMessage(acct.username + ' filtered - account is not followed by you')
        filtered = true;
    }

    if (acct.is_verified == true && gblOptions.filterOptions.verified == false) {
        outputMessage(acct.username + ' filtered - account is verified')
        filtered = true;
    }
    if (acct.is_verified == false && gblOptions.filterOptions.non_verified == false) {
        outputMessage(acct.username + ' filtered - account is not verified')
        filtered = true;
    }

    if (filtered === true) {
        return false;
    }

    if (!acct.edge_followed_by) acct = await getAdditionalDataForAcct(acct);

    if (acct.assumedDeleted) {
        outputMessage('Account may have been deleted');
        return false;
    }

    if (acct.edge_followed_by.count < gblOptions.filterOptions.followers[0]) {
        outputMessage(acct.username + ' filtered - too few followers')
        filtered = true;
    }
    if (acct.edge_followed_by.count > gblOptions.filterOptions.followers[1]) {
        outputMessage(acct.username + ' filtered - too many followers')
        filtered = true;
    }
    if (acct.edge_follow.count < gblOptions.filterOptions.following[0]) {
        outputMessage(acct.username + ' filtered - too few following')
        filtered = true;
    }
    if (acct.edge_follow.count > gblOptions.filterOptions.following[1]) {
        outputMessage(acct.username + ' filtered - too many following')
        filtered = true;
    }
    if (acct.edge_mutual_followed_by.count < gblOptions.filterOptions.mutualFollowedBy[0]) {
        outputMessage(acct.username + ' filtered - too few mutual followers')
        filtered = true;
    }
    if (acct.edge_mutual_followed_by.count > gblOptions.filterOptions.mutualFollowedBy[1]) {
        outputMessage(acct.username + ' filtered - too many mutual followers')
        filtered = true;
    }

    if (acct.followRatio < gblOptions.filterOptions.followRatio[0]) {
        outputMessage(acct.username + ' filtered - follow ratio too low')
        filtered = true;
    }
    if (acct.followRatio > gblOptions.filterOptions.followRatio[1]) {
        outputMessage(acct.username + ' filtered - follow ratio too high')
        filtered = true;
    }
    if (acct.edge_owner_to_timeline_media.count < gblOptions.filterOptions.posts[0]) {
        outputMessage(acct.username + ' filtered - too few posts')
        filtered = true;
    }
    if (acct.edge_owner_to_timeline_media.count > gblOptions.filterOptions.posts[1]) {
        outputMessage(acct.username + ' filtered - too many posts')
        filtered = true;
    }
    if (acct.lastPostDateInDays < gblOptions.filterOptions.lastPosted[0]) {
        outputMessage(acct.username + ' filtered - posted too recently')
        filtered = true;
    }

    // data doesn't exit properly for private accounts, so skip this filter if account is private
    if (acct.lastPostDateInDays > gblOptions.filterOptions.lastPosted[1] && (acct.is_private == false || acct.followed_by_viewer == true)) {
        outputMessage(acct.username + ' filtered - posted too long ago')
        filtered = true;
    }
    if (acct.is_private == true && gblOptions.filterOptions.private == false) {
        outputMessage(acct.username + ' filtered - account is private')
        filtered = true;
    }
    if (acct.is_private == false && gblOptions.filterOptions.non_private == false) {
        outputMessage(acct.username + ' filtered - account is public')
        filtered = true;
    }

    if (acct.follows_viewer == true && gblOptions.filterOptions.follows_me == false) {
        outputMessage(acct.username + ' filtered - account follows you')
        filtered = true;
    }
    if (acct.follows_viewer == false && gblOptions.filterOptions.non_follows_me == false) {
        outputMessage(acct.username + ' filtered - account does not follow you')
        filtered = true;
    }
    if (acct.is_business_account == true && gblOptions.filterOptions.is_business_account == false) {
        outputMessage(acct.username + ' filtered - account is a business account')
        filtered = true;
    }
    if (acct.is_business_account == false && gblOptions.filterOptions.non_is_business_account == false) {
        outputMessage(acct.username + ' filtered - account is not a business account')
        filtered = true;
    }
    if (acct.is_joined_recently == true && gblOptions.filterOptions.is_joined_recently == false) {
        outputMessage(acct.username + ' filtered - account joined recently')
        filtered = true;
    }
    if (acct.is_joined_recently == false && gblOptions.filterOptions.non_is_joined_recently == false) {
        outputMessage(acct.username + ' filtered - account did not join recently')
        filtered = true;
    }

    if (gblOptions.filterOptions.bio_contains == true) {
        var bioContains = false;

        if (acct.biography) {
            var bioContainsStrings = gblOptions.filterOptions.bio_contains_text.split(',');
            for (var i = 0; i < bioContainsStrings.length; i++) {
                if (acct.biography.toLowerCase().indexOf(bioContainsStrings[i].toLowerCase()) > -1) {
                    bioContains = true;
                }
            }
        }

        if (bioContains == false) {
            filtered = true;
            outputMessage(acct.username + ' filtered - bio does not contain ' + gblOptions.filterOptions.bio_contains_text);
        }
    }

    if (gblOptions.filterOptions.bio_not_contains == true) {
        var bioContains = false;

        if (acct.biography) {
            var bioContainsStrings = gblOptions.filterOptions.bio_not_contains_text.split(',');
            for (var i = 0; i < bioContainsStrings.length; i++) {
                if (acct.biography.toLowerCase().indexOf(bioContainsStrings[i].toLowerCase()) > -1) {
                    bioContains = true;
                    outputMessage(acct.username + ' filtered - bio contains ' + bioContainsStrings[i].toLowerCase());
                }
            }
        }

        if (bioContains == true) {
            filtered = true;
        }
    }


    if (gblOptions.filterOptions.external_url_contains == true) {
        var externalUrlContains = false;

        if (acct.external_url) {
            var externalUrlContainsStrings = gblOptions.filterOptions.external_url_contains_text.split(',');
            for (var i = 0; i < externalUrlContainsStrings.length; i++) {
                if (acct.external_url.toLowerCase().indexOf(externalUrlContainsStrings[i].toLowerCase()) > -1) {
                    externalUrlContains = true;
                }
            }
        }

        if (externalUrlContains == false) {
            filtered = true;
            outputMessage(acct.username + ' filtered - external url does not contain ' + gblOptions.filterOptions.external_url_contains_text);
        }
    }

    if (gblOptions.filterOptions.external_url_not_contains == true) {
        var externalUrlContains = false;

        if (acct.external_url) {
            var externalUrlNotContainsStrings = gblOptions.filterOptions.external_url_not_contains_text.split(',');
            for (var i = 0; i < externalUrlNotContainsStrings.length; i++) {
                if (acct.external_url.toLowerCase().indexOf(externalUrlNotContainsStrings[i].toLowerCase()) > -1) {
                    externalUrlContains = true;
                    outputMessage(acct.username + ' filtered - external url contains ' + externalUrlNotContainsStrings[i].toLowerCase());
                }
            }
        }

        if (externalUrlContains == true) {
            filtered = true;
        }
    }

    if (gblOptions.filterOptions.business_category_name_contains == true) {
        var BusinessCategoryNameContains = false;

        if (acct.business_category_name) {
            var businessCategoryNameContainsStrings = gblOptions.filterOptions.business_category_name_contains_text.split(',');
            for (var i = 0; i < businessCategoryNameContainsStrings.length; i++) {
                if (acct.business_category_name.toLowerCase().indexOf(businessCategoryNameContainsStrings[i].toLowerCase()) > -1) {
                    BusinessCategoryNameContains = true;
                }
            }
        }

        if (BusinessCategoryNameContains == false) {
            filtered = true;
            outputMessage(acct.username + ' filtered - business category name does not contain ' + gblOptions.filterOptions.business_category_name_contains_text);
        }
    }

    if (gblOptions.filterOptions.business_category_name_not_contains == true) {
        var BusinessCategoryNameContains = false;

        if (acct.business_category_name) {
            var businessCategoryNameContainsStrings = gblOptions.filterOptions.business_category_name_not_contains_text.split(',');
            for (var i = 0; i < businessCategoryNameContainsStrings.length; i++) {
                if (acct.business_category_name.toLowerCase().indexOf(businessCategoryNameContainsStrings[i].toLowerCase()) > -1) {
                    BusinessCategoryNameContains = true;
                    outputMessage(acct.username + ' filtered - business category name contains ' + businessCategoryNameContainsStrings[i].toLowerCase());
                }
            }
        }

        if (BusinessCategoryNameContains == true) {
            filtered = true;
        }
    }


    if (filtered === true) {
        return false;
    } else {
        return true;
    }

}

async function filterCriteriaMetForUnfollowing(acct) {

    if (gblOptions.unFollowFresh === false || gblOptions.dontUnFollowNonGrowbot === true || gblOptions.unFollowIfOld === true) {
        var acctFromStorage = alreadyAttempted(acct);

        if (gblOptions.dontUnFollowNonGrowbot === true && acctFromStorage === false) {
            outputMessage(acct.username + ' was followed outside of Growbot, skipping');
            addStamp(acct.id, 'stamp-div-grey', 'non-growbot');
            return false;
        }

        var timeSinceFollowed = today - acctFromStorage.followAttemptDate;

        if (acctFromStorage != false && acctFromStorage.followAttemptDate && gblOptions.unFollowFresh == false && timeSinceFollowed < gblOptions.unFollowDelay) {
            outputMessage(acct.username + ' was followed too recently to unfollow ' + millisecondsToHumanReadable(timeSinceFollowed, true));
            addStamp(acct.id, 'stamp-div-grey', 'too recent');
            return false;
        }
    }

    if (gblOptions.dontUnFollowFilters === true) {

        var filtered = false;

        if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) > -1 && gblOptions.filterOptions.no_profile_pic == false) {
            outputMessage(acct.username + ' filtered - has no profile picture')
            filtered = true;
        }

        if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) == -1 && gblOptions.filterOptions.profile_pic == false) {
            outputMessage(acct.username + ' filtered - has profile picture')
            filtered = true;
        }

        if (acct.is_verified == true && gblOptions.filterOptions.verified == false) {
            outputMessage(acct.username + ' filtered - account is verified')
            filtered = true;
        }
        if (acct.is_verified == false && gblOptions.filterOptions.non_verified == false) {
            outputMessage(acct.username + ' filtered - account is not verified')
            filtered = true;
        }
    }


    if (!acct.edge_followed_by) acct = await getAdditionalDataForAcct(acct);

    if (gblOptions.dontUnFollowFollowers === true) {
        if (acct.follows_viewer == true) {
            if (gblOptions.unFollowIfOld == true && timeSinceFollowed > gblOptions.unFollowIfOlderThan) {
                outputMessage(acct.username + ' was followed more than ' + millisecondsToHumanReadable(gblOptions.unFollowIfOlderThan, false).days + ' days ago, OK to unfollow')
                return true;
            } else {
                outputMessage(acct.username + ' is one of your followers, skipping');
                addStamp(acct.id, 'stamp-div-grey', 'follows you');
                return false;
            }
        }
    }


    if (acct.assumedDeleted) return false;

    if (gblOptions.dontUnFollowFilters === true) {

        if (acct.edge_followed_by.count < gblOptions.filterOptions.followers[0]) {
            outputMessage(acct.username + ' filtered - too few followers')
            filtered = true;
        }
        if (acct.edge_followed_by.count > gblOptions.filterOptions.followers[1]) {
            outputMessage(acct.username + ' filtered - too many followers')
            filtered = true;
        }
        if (acct.edge_follow.count < gblOptions.filterOptions.following[0]) {
            outputMessage(acct.username + ' filtered - too few following')
            filtered = true;
        }
        if (acct.edge_follow.count > gblOptions.filterOptions.following[1]) {
            outputMessage(acct.username + ' filtered - too many following')
            filtered = true;
        }
        if (acct.edge_mutual_followed_by.count < gblOptions.filterOptions.mutualFollowedBy[0]) {
            outputMessage(acct.username + ' filtered - too few mutual followers')
            filtered = true;
        }
        if (acct.edge_mutual_followed_by.count > gblOptions.filterOptions.mutualFollowedBy[1]) {
            outputMessage(acct.username + ' filtered - too many mutual followers')
            filtered = true;
        }
        if (acct.followRatio < gblOptions.filterOptions.followRatio[0]) {
            outputMessage(acct.username + ' filtered - follow ratio too low')
            filtered = true;
        }
        if (acct.followRatio > gblOptions.filterOptions.followRatio[1]) {
            outputMessage(acct.username + ' filtered - follow ratio too high')
            filtered = true;
        }
        if (acct.edge_owner_to_timeline_media.count < gblOptions.filterOptions.posts[0]) {
            outputMessage(acct.username + ' filtered - too few posts')
            filtered = true;
        }
        if (acct.edge_owner_to_timeline_media.count > gblOptions.filterOptions.posts[1]) {
            outputMessage(acct.username + ' filtered - too many posts')
            filtered = true;
        }
        if (acct.lastPostDateInDays < gblOptions.filterOptions.lastPosted[0]) {
            outputMessage(acct.username + ' filtered - posted too recently')
            filtered = true;
        }
        if (acct.lastPostDateInDays > gblOptions.filterOptions.lastPosted[1] && (acct.is_private == false || acct.followed_by_viewer == true)) {
            outputMessage(acct.username + ' filtered - posted too long ago')
            filtered = true;
        }
        if (acct.is_private == true && gblOptions.filterOptions.private == false) {
            outputMessage(acct.username + ' filtered - account is private')
            filtered = true;
        }
        if (acct.is_private == false && gblOptions.filterOptions.non_private == false) {
            outputMessage(acct.username + ' filtered - account is public')
            filtered = true;
        }
        if (acct.is_business_account == true && gblOptions.filterOptions.is_business_account == false) {
            outputMessage(acct.username + ' filtered - account is a business account')
            filtered = true;
        }
        if (acct.is_business_account == false && gblOptions.filterOptions.non_is_business_account == false) {
            outputMessage(acct.username + ' filtered - account is not a business account')
            filtered = true;
        }
        if (acct.is_joined_recently == true && gblOptions.filterOptions.is_joined_recently == false) {
            outputMessage(acct.username + ' filtered - account joined recently')
            filtered = true;
        }
        if (acct.is_joined_recently == false && gblOptions.filterOptions.non_is_joined_recently == false) {
            outputMessage(acct.username + ' filtered - account did not join recently')
            filtered = true;
        }

        if (gblOptions.filterOptions.bio_contains == true) {
            var bioContains = false;

            if (acct.biography) {
                var bioContainsStrings = gblOptions.filterOptions.bio_contains_text.split(',');
                for (var i = 0; i < bioContainsStrings.length; i++) {
                    if (acct.biography.toLowerCase().indexOf(bioContainsStrings[i].toLowerCase()) > -1) {
                        bioContains = true;
                    }
                }
            }

            if (bioContains == false) {
                filtered = true;
                outputMessage(acct.username + ' filtered - bio does not contain ' + gblOptions.filterOptions.bio_contains_text);
            }
        }

        if (gblOptions.filterOptions.bio_not_contains == true) {
            var bioContains = false;

            if (acct.biography) {
                var bioContainsStrings = gblOptions.filterOptions.bio_not_contains_text.split(',');
                for (var i = 0; i < bioContainsStrings.length; i++) {
                    if (acct.biography.toLowerCase().indexOf(bioContainsStrings[i].toLowerCase()) > -1) {
                        bioContains = true;
                        outputMessage(acct.username + ' filtered - bio contains ' + bioContainsStrings[i].toLowerCase());
                    }
                }
            }

            if (bioContains == true) {
                filtered = true;
            }
        }


        if (gblOptions.filterOptions.external_url_contains == true) {
            var externalUrlContains = false;

            if (acct.external_url) {
                var externalUrlContainsStrings = gblOptions.filterOptions.external_url_contains_text.split(',');
                for (var i = 0; i < externalUrlContainsStrings.length; i++) {
                    if (acct.external_url.toLowerCase().indexOf(externalUrlContainsStrings[i].toLowerCase()) > -1) {
                        externalUrlContains = true;
                    }
                }
            }

            if (externalUrlContains == false) {
                filtered = true;
                outputMessage(acct.username + ' filtered - external url does not contain ' + gblOptions.filterOptions.external_url_contains_text);
            }
        }

        if (gblOptions.filterOptions.external_url_not_contains == true) {
            var externalUrlContains = false;

            if (acct.external_url) {
                var externalUrlNotContainsStrings = gblOptions.filterOptions.external_url_not_contains_text.split(',');
                for (var i = 0; i < externalUrlNotContainsStrings.length; i++) {
                    if (acct.external_url.toLowerCase().indexOf(externalUrlNotContainsStrings[i].toLowerCase()) > -1) {
                        externalUrlContains = true;
                        outputMessage(acct.username + ' filtered - external url contains ' + externalUrlNotContainsStrings[i].toLowerCase());
                    }
                }
            }

            if (externalUrlContains == true) {
                filtered = true;
            }
        }


        if (gblOptions.filterOptions.business_category_name_contains == true) {
            var BusinessCategoryNameContains = false;

            if (acct.business_category_name) {
                var businessCategoryNameContainsStrings = gblOptions.filterOptions.business_category_name_contains_text.split(',');
                for (var i = 0; i < businessCategoryNameContainsStrings.length; i++) {
                    if (acct.business_category_name.toLowerCase().indexOf(businessCategoryNameContainsStrings[i].toLowerCase()) > -1) {
                        BusinessCategoryNameContains = true;
                    }
                }
            }

            if (BusinessCategoryNameContains == false) {
                filtered = true;
                outputMessage(acct.username + ' filtered - business category name does not contain ' + gblOptions.filterOptions.business_category_name_contains_text);
            }
        }

        if (gblOptions.filterOptions.business_category_name_not_contains == true) {
            var BusinessCategoryNameContains = false;

            if (acct.business_category_name) {
                var businessCategoryNameContainsStrings = gblOptions.filterOptions.business_category_name_not_contains_text.split(',');
                for (var i = 0; i < businessCategoryNameContainsStrings.length; i++) {
                    if (acct.business_category_name.toLowerCase().indexOf(businessCategoryNameContainsStrings[i].toLowerCase()) > -1) {
                        BusinessCategoryNameContains = true;
                        outputMessage(acct.username + ' filtered - business category name contains ' + businessCategoryNameContainsStrings[i].toLowerCase());
                    }
                }
            }

            if (BusinessCategoryNameContains == true) {
                filtered = true;
            }
        }


    }

    return filtered;

}

async function filterCriteriaMetForRemoveOrBlock(acct) {

    var filtered = false;

    if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) > -1 && gblOptions.filterOptions.no_profile_pic == false) {
        outputMessage(acct.username + ' filtered - has no profile picture')
        filtered = true;
    }

    if (acct.profile_pic_url.indexOf(igExternalVars.emptyProfilePicUrl) == -1 && gblOptions.filterOptions.profile_pic == false) {
        outputMessage(acct.username + ' filtered - has profile picture')
        filtered = true;
    }

    if (acct.followed_by_viewer == true && gblOptions.filterOptions.followed_by_me == false) {
        outputMessage(acct.username + ' filtered - account is followed by you')
        filtered = true;
    }

    if (acct.followed_by_viewer == false && gblOptions.filterOptions.non_followed_by_me == false) {
        outputMessage(acct.username + ' filtered - account is not followed by you')
        filtered = true;
    }

    if (acct.is_verified == true && gblOptions.filterOptions.verified == false) {
        outputMessage(acct.username + ' filtered - account is verified')
        filtered = true;
    }
    if (acct.is_verified == false && gblOptions.filterOptions.non_verified == false) {
        outputMessage(acct.username + ' filtered - account is not verified')
        filtered = true;
    }

    if (!acct.edge_followed_by) acct = await getAdditionalDataForAcct(acct);

    if (acct.assumedDeleted) return false;

    if (acct.edge_followed_by.count < gblOptions.filterOptions.followers[0]) {
        outputMessage(acct.username + ' filtered - too few followers')
        filtered = true;
    }
    if (acct.edge_followed_by.count > gblOptions.filterOptions.followers[1]) {
        outputMessage(acct.username + ' filtered - too many followers')
        filtered = true;
    }
    if (acct.edge_follow.count < gblOptions.filterOptions.following[0]) {
        outputMessage(acct.username + ' filtered - too few following')
        filtered = true;
    }
    if (acct.edge_follow.count > gblOptions.filterOptions.following[1]) {
        outputMessage(acct.username + ' filtered - too many following')
        filtered = true;
    }
    if (acct.edge_mutual_followed_by.count < gblOptions.filterOptions.mutualFollowedBy[0]) {
        outputMessage(acct.username + ' filtered - too few mutual followers')
        filtered = true;
    }
    if (acct.edge_mutual_followed_by.count > gblOptions.filterOptions.mutualFollowedBy[1]) {
        outputMessage(acct.username + ' filtered - too many mutual followers')
        filtered = true;
    }
    if (acct.followRatio < gblOptions.filterOptions.followRatio[0]) {
        outputMessage(acct.username + ' filtered - follow ratio too low')
        filtered = true;
    }
    if (acct.followRatio > gblOptions.filterOptions.followRatio[1]) {
        outputMessage(acct.username + ' filtered - follow ratio too high')
        filtered = true;
    }
    if (acct.edge_owner_to_timeline_media.count < gblOptions.filterOptions.posts[0]) {
        outputMessage(acct.username + ' filtered - too few posts')
        filtered = true;
    }
    if (acct.edge_owner_to_timeline_media.count > gblOptions.filterOptions.posts[1]) {
        outputMessage(acct.username + ' filtered - too many posts')
        filtered = true;
    }
    if (acct.lastPostDateInDays < gblOptions.filterOptions.lastPosted[0]) {
        outputMessage(acct.username + ' filtered - posted too recently')
        filtered = true;
    }
    if (acct.lastPostDateInDays > gblOptions.filterOptions.lastPosted[1] && (acct.is_private == false || acct.followed_by_viewer == true)) {
        outputMessage(acct.username + ' filtered - posted too long ago')
        filtered = true;
    }
    if (acct.is_private == true && gblOptions.filterOptions.private == false) {
        outputMessage(acct.username + ' filtered - account is private')
        filtered = true;
    }
    if (acct.is_private == false && gblOptions.filterOptions.non_private == false) {
        outputMessage(acct.username + ' filtered - account is public')
        filtered = true;
    }
    if (acct.is_business_account == true && gblOptions.filterOptions.is_business_account == false) {
        outputMessage(acct.username + ' filtered - account is a business account')
        filtered = true;
    }
    if (acct.is_business_account == false && gblOptions.filterOptions.non_is_business_account == false) {
        outputMessage(acct.username + ' filtered - account is not a business account')
        filtered = true;
    }
    if (acct.is_joined_recently == true && gblOptions.filterOptions.is_joined_recently == false) {
        outputMessage(acct.username + ' filtered - account joined recently')
        filtered = true;
    }
    if (acct.is_joined_recently == false && gblOptions.filterOptions.non_is_joined_recently == false) {
        outputMessage(acct.username + ' filtered - account did not join recently')
        filtered = true;
    }

    if (gblOptions.filterOptions.bio_contains == true) {
        var bioContains = false;

        if (acct.biography) {
            var bioContainsStrings = gblOptions.filterOptions.bio_contains_text.split(',');
            for (var i = 0; i < bioContainsStrings.length; i++) {
                if (acct.biography.toLowerCase().indexOf(bioContainsStrings[i].toLowerCase()) > -1) {
                    bioContains = true;
                }
            }
        }

        if (bioContains == false) {
            filtered = true;
            outputMessage(acct.username + ' filtered - bio does not contain ' + gblOptions.filterOptions.bio_contains_text);
        }
    }

    if (gblOptions.filterOptions.bio_not_contains == true) {
        var bioContains = false;

        if (acct.biography) {
            var bioContainsStrings = gblOptions.filterOptions.bio_not_contains_text.split(',');
            for (var i = 0; i < bioContainsStrings.length; i++) {
                if (acct.biography.toLowerCase().indexOf(bioContainsStrings[i].toLowerCase()) > -1) {
                    bioContains = true;
                    outputMessage(acct.username + ' filtered - bio contains ' + bioContainsStrings[i].toLowerCase());
                }
            }
        }

        if (bioContains == true) {
            filtered = true;
        }
    }

    if (gblOptions.filterOptions.external_url_contains == true) {
        var externalUrlContains = false;

        if (acct.external_url) {
            var externalUrlContainsStrings = gblOptions.filterOptions.external_url_contains_text.split(',');
            for (var i = 0; i < externalUrlContainsStrings.length; i++) {
                if (acct.external_url.toLowerCase().indexOf(externalUrlContainsStrings[i].toLowerCase()) > -1) {
                    externalUrlContains = true;
                }
            }
        }

        if (externalUrlContains == false) {
            filtered = true;
            outputMessage(acct.username + ' filtered - external url does not contain ' + gblOptions.filterOptions.external_url_contains_text);
        }
    }

    if (gblOptions.filterOptions.external_url_not_contains == true) {
        var externalUrlContains = false;

        if (acct.external_url) {
            var externalUrlContainsStrings = gblOptions.filterOptions.bio_not_contains_text.split(',');
            for (var i = 0; i < bioContainsStrings.length; i++) {
                if (acct.external_url.toLowerCase().indexOf(externalUrlContainsStrings[i].toLowerCase()) > -1) {
                    externalUrlContains = true;
                    outputMessage(acct.username + ' filtered - external url contains ' + externalUrlContainsStrings[i].toLowerCase());
                }
            }
        }

        if (externalUrlContains == true) {
            filtered = true;
        }
    }



    if (gblOptions.filterOptions.business_category_name_contains == true) {
        var BusinessCategoryNameContains = false;

        if (acct.business_category_name) {
            var businessCategoryNameContainsStrings = gblOptions.filterOptions.business_category_name_contains_text.split(',');
            for (var i = 0; i < businessCategoryNameContainsStrings.length; i++) {
                if (acct.business_category_name.toLowerCase().indexOf(businessCategoryNameContainsStrings[i].toLowerCase()) > -1) {
                    BusinessCategoryNameContains = true;
                }
            }
        }

        if (BusinessCategoryNameContains == false) {
            filtered = true;
            outputMessage(acct.username + ' filtered - business category name does not contain ' + gblOptions.filterOptions.business_category_name_contains_text);
        }
    }

    if (gblOptions.filterOptions.business_category_name_not_contains == true) {
        var BusinessCategoryNameContains = false;

        if (acct.business_category_name) {
            var businessCategoryNameContainsStrings = gblOptions.filterOptions.business_category_name_not_contains_text.split(',');
            for (var i = 0; i < businessCategoryNameContainsStrings.length; i++) {
                if (acct.business_category_name.toLowerCase().indexOf(businessCategoryNameContainsStrings[i].toLowerCase()) > -1) {
                    BusinessCategoryNameContains = true;
                    outputMessage(acct.username + ' filtered - business category name contains ' + businessCategoryNameContainsStrings[i].toLowerCase());
                }
            }
        }

        if (BusinessCategoryNameContains == true) {
            filtered = true;
        }
    }


    return filtered;

}


function bindNoUiSliders() {

    var sliderElements = ['followersSlider', 'followingSlider', 'followRatioSlider', 'mutualFollowedBySlider', 'postsSlider', 'lastPostedSlider'];

    for (var i = 0; i < sliderElements.length; i++) {

        var currentSlider = document.getElementById(sliderElements[i]);

        //hacky?
        var fromOptions = gblOptions.filterOptions[sliderElements[i].replace('Slider', '')];

        var dFO = defaultFilterOptions[sliderElements[i].replace('Slider', '')];

        if (sliderElements[i] == 'followRatioSlider') {
            noUiSlider.create(currentSlider, {
                start: fromOptions,
                range: {
                    'min': [dFO[0]],
                    '5%': [0],
                    '10%': [0.25],
                    '15%': [0.5],
                    '20%': [0.75],
                    '25%': [1],
                    '30%': [1.25],
                    '35%': [1.5],
                    '40%': [1.75],
                    '45%': [2],
                    '50%': [3],
                    '55%': [4],
                    'max': [dFO[1]]
                },
                //pips: { mode: 'values', values: [-7500, 0, 0.5,.75, 1,1.25,1.5,1.75,2,3,4, 10000], density: 10, stepped: true, format: wNumb({decimals:2}) },
                pips: {
                    mode: 'range',
                    density: 10,
                    stepped: true,
                    format: wNumb({
                        decimals: 2
                    })
                },
                connect: [false, true, false]
            });
        } else if (sliderElements[i] == 'followersSlider' || sliderElements[i] == 'mutualFollowedBySlider') {
            noUiSlider.create(currentSlider, {
                start: fromOptions,
                range: {
                    'min': [dFO[0]],
                    '5%': [10],
                    '20%': [100],
                    '50%': [5000],
                    '70%': [10000],
                    '80%': [100000],
                    '90%': [1000000],
                    'max': [dFO[1]]
                },
                //pips: { mode: 'values', values: [-7500, 0, 0.5,.75, 1,1.25,1.5,1.75,2,3,4, 10000], density: 10, stepped: true, format: wNumb({decimals:2}) },
                pips: {
                    mode: 'range',
                    density: 10,
                    stepped: true
                },
                connect: [false, true, false],
                format: wNumb({
                    decimals: 0
                })
            });

        } else {
            noUiSlider.create(currentSlider, {
                start: fromOptions,
                range: {
                    'min': [dFO[0]],
                    '5%': [10],
                    '20%': [100],
                    'max': [dFO[1]]
                },
                pips: {
                    mode: 'range',
                    density: 5
                },
                connect: [false, true, false],
                format: wNumb({
                    decimals: 0
                })
            });
        }

        currentSlider.noUiSlider.on('set', updateFilterOptions);


        function sp(event) {
            event.stopPropagation();
        }

        function setTooltipInputWidth(input) {
            input.style.width = ((input.value.length + 1) * 6) + 'px';
        }

        function makeTT(i, slider) {
            var tooltip = document.createElement('div'),
                input = document.createElement('input');

            // Add the input to the tooltip
            tooltip.className = 'noUi-tooltip';
            tooltip.appendChild(input);

            // On change, set the slider
            input.addEventListener('change', function() {
                var values = [null, null];
                values[i] = this.value;
                slider.noUiSlider.set(values)
                setTooltipInputWidth(this);
            });

            input.addEventListener('focus', function() {
                $(slider.tooltipInputs[0]).closest('.noUi-origin')[0].style.zIndex = 4;
                $(slider.tooltipInputs[1]).closest('.noUi-origin')[0].style.zIndex = 4;

                $(this).closest('.noUi-origin')[0].style.zIndex = 5;

            })

            // Catch all selections and make sure they don't reach the handle
            input.addEventListener('mousedown', sp);
            input.addEventListener('touchstart', sp);
            input.addEventListener('pointerdown', sp);
            input.addEventListener('MSPointerDown', sp);

            // Find the lower/upper slider handle and insert the tooltip
            slider.querySelector(i ? '.noUi-handle-upper' : '.noUi-handle-lower').appendChild(tooltip);

            return input;
        }

        // An 0/1 indexed array of input elements
        currentSlider.tooltipInputs = [makeTT(0, currentSlider), makeTT(1, currentSlider)];

        // When the slider changes, update the tooltip
        currentSlider.noUiSlider.on('update', function(values, handle) {
            this.target.tooltipInputs[handle].value = values[handle];
            setTooltipInputWidth(this.target.tooltipInputs[handle]);
        });

    }


    function updateFilterOptions() {
        for (var i = 0; i < sliderElements.length; i++) {
            var currentSlider = document.getElementById(sliderElements[i]);
            gblOptions.filterOptions[sliderElements[i].replace('Slider', '')] = currentSlider.noUiSlider.get().map(Number);
        }
        saveOptions();
    }

    function resetFilterSliders() {
        for (var i = 0; i < sliderElements.length; i++) {
            document.getElementById(sliderElements[i]).noUiSlider.reset();
        }
    }


    $('#btnResetFilter').click(resetFilterSliders);

}

function setCurrentPageUsername() {
    if (getCurrentPageUsername() != '') {
        $('#btnGetAllUsersFollowers')
            .removeClass('inactive')
            .text(chrome.i18n.getMessage('LoadCurrentFollowers', getCurrentPageUsername()))
            .off('click.ajaxGetAllUsersFollowers')
            .on('click.ajaxGetAllUsersFollowers', ajaxGetAllUsersFollowers);
        $('#btnGetAllUsersFollowing')
            .removeClass('inactive')
            .text(chrome.i18n.getMessage('LoadCurrentFollowing', getCurrentPageUsername()))
            .off('click.ajaxLoadFollowing')
            .on('click.ajaxLoadFollowing', ajaxLoadFollowing);

        $('#btnGetCommenters').removeClass('inactive')
            .text(chrome.i18n.getMessage('LoadCommenters', getCurrentPageUsername()))
            .off('click.getCommenters')
            .on('click.getCommenters', ajaxLoadAllUsersCommenters);

        $('#btnGetLikers')
            .removeClass('inactive')
            .text(chrome.i18n.getMessage('LoadLikers', getCurrentPageUsername()))
            .off('click.getLikers')
            .on('click.getLikers', ajaxLoadAllUsersLikers);

    } else {

        $('#igBotInjectedContainer #btnGetAllUsersFollowers,#igBotInjectedContainer #btnGetAllUsersFollowing').click(function() {
            outputMessage('Error: must be on an instagram user page (or try reloading).');
        }).addClass('inactive');
    }
}

function checkUsernameFreshness() {
    if ($('h1._rf3jb.notranslate').text() != getCurrentPageUsername()) {
        ajaxGetCurrentPageUserInfo();
        return false;
    }
    return true;
}

function getCurrentPageUsername() {
    if (currentProfilePage != false && currentProfilePage) {
        return currentProfilePage.username;
    } else {
        ajaxGetCurrentPageUserInfo();
        return '';
    }
}

function getQueryParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function ajaxGetCurrentPageUserInfo(urlprefix) {

    if (!urlprefix) {
        urlprefix = urlAcctInfo;
    }

    var username = $('h2._7UhW9').text();
    if (username == '') username = window.location.pathname.split('/')[1];
    if (username == 'explore' || username == 'stories' || username === 'accounts' || username === 'direct') username = '';

    if (username == 'p') username = getQueryParameterByName('taken-by') || getUsernameFromPostHtml();

    if (username.indexOf('Edit Profile') > -1) username = username.replace('Edit Profile', '');

    if ((currentProfilePage == false && username != '') || (username != '' && currentProfilePage.username != username)) {

        $.ajax({
            url: '' + urlprefix + username,
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
                xhr.setRequestHeader('x-asbd-id', '198387');
                xhr.setRequestHeader('x-ig-app-id', '936619743392459');
            },
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(err) {
            if (err.status === 429) {
                printMessage(chrome.i18n.getMessage('RateLimit429', [(gblOptions.timeDelayAfter429RateLimit / 60000)]));
                setTimeout(ajaxGetCurrentPageUserInfo, (gblOptions.timeDelayAfter429RateLimit / 60000));
                clearInterval(usernameCheckInterval);
            }
        }).done(function(data) {
            currentProfilePage = extractJSONfromUserPageHTML(data);

            if (currentProfilePage !== false) {
                setCurrentPageUsername();
                startUserNameFreshnessInterval();
            } else {
                //outputMessage('Error loading current user page');
                clearInterval(usernameCheckInterval);
                ajaxGetCurrentPageUserInfo(urlAcctInfo2);
            }

        });
    }
}

function getUsernameFromPostHtml() {
    return $('header a.ZIAjV').text();
}

function extractJSONfromUserPageHTML(data) {

    var pureJSON = data.data;
    if (pureJSON && pureJSON.user) {
        return pureJSON.user;
    }

    if (data && data.user) {
        //console.log(data);
        var scriptSection = data.substring(data.indexOf('<script type="text/javascript">window._sharedData = ') + 52, data.indexOf(';</script>', data.indexOf('<script type="text/javascript">window._sharedData = ')));
        var scriptSectionAdditional = data.substring(data.indexOf('{', data.indexOf('<script type="text/javascript">window.__additionalDataLoaded(')), data.indexOf(');</script>', data.indexOf('<script type="text/javascript">window.__additionalDataLoaded(')));

        if (data.indexOf('<script type="text/javascript">window._sharedData = ') < 0 && data.indexOf('<script type="text/javascript">window.__additionalDataLoaded(') < 0) {
            return false;;
        }

        var jsondata = JSON.parse(scriptSection);
        if (jsondata && jsondata.entry_data && jsondata.entry_data.ProfilePage && jsondata.entry_data.ProfilePage.length > 0 && jsondata.entry_data.ProfilePage[0].hasOwnProperty('graphql')) {
            var user = jsondata.entry_data.ProfilePage[0].graphql.user;
            // console.log('got user ' + user.username + ' from jsondata 1');
            return user;
        }

        var jsondataAdditional = JSON.parse(scriptSectionAdditional);
        if (jsondataAdditional && jsondataAdditional.hasOwnProperty('graphql')) {
            var user = jsondataAdditional.graphql.user;
            //console.log('got user ' + user.username + ' from jsondata additional');
            return user;
        }
    }
    //console.log('could not extract json from userpage html parsed json')
    return false;

}


function setCurrentPageHashtag() {
    var hashtagFromUrl = getHashtagFromUrl();

    if (hashtagFromUrl != '') {

        $('#igBotInjectedContainer #btnLoadHashtagPosters')
            .removeClass('inactive')
            .off('click.ajaxLoadPostersFromHashtag')
            .on('click.ajaxLoadPostersFromHashtag', ajaxLoadPostersFromHashtag)
            .text(chrome.i18n.getMessage('LoadCurrentHashtagPosters', hashtagFromUrl));

        $('.hashtagName').text('#' + hashtagFromUrl);

        $('#igBotInjectedContainer #btnLikeHashtag')
            .removeClass('inactive')
            .off('click.ajaxLikeAllPostsFromHashtag')
            .on('click.ajaxLikeAllPostsFromHashtag', ajaxLikeAllPostsFromHashtag);

        $('#igBotInjectedContainer #btnLikeHashtag').children().click(function(e) {
            return false;
        });

    } else {
        $('.hashtagName').text('#' + chrome.i18n.getMessage('HashtagPage'));

        $('#igBotInjectedContainer #btnLoadHashtagPosters')
            .text(chrome.i18n.getMessage('LoadCurrentHashtagPosters', chrome.i18n.getMessage('HashtagPage')));

        $('#igBotInjectedContainer #btnLikeHashtag, #igBotInjectedContainer #btnLoadHashtagPosters')
            .addClass('inactive')
            .off('click.ajaxLoadPostersFromHashtag')
            .off('click.ajaxLikeAllPostsFromHashtag')
            .off('click.hashtagButtonError')
            .on('click.hashtagButtonError', function() {
                outputMessage('Error: must be on an instagram hashtag page');
            });
    }
}


function getHashtagFromUrl() {

    if (window.location.href.indexOf('/explore/tags/') == -1) {
        return '';
    }

    var tagFromUrl = window.location.href;
    tagFromUrl = tagFromUrl.replace('https://www.instagram.com/explore/tags/', '');
    tagFromUrl = tagFromUrl.slice(0, tagFromUrl.indexOf('/'));

    tagFromUrl = decodeURIComponent(tagFromUrl);

    return tagFromUrl;
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function saveHiddenStatus(hiddenStatus) {
    chrome.storage.sync.set({
        'igBotHidden': hiddenStatus
    });
}

function getHiddenStatus(callback) {

    chrome.storage.sync.get('igBotHidden', function(object) {

        var hiddenStatus = false;

        if (typeof object['igBotHidden'] != 'undefined') {
            hiddenStatus = object['igBotHidden'];
        } else {
            hiddenStatus = false;
        }

        callback(hiddenStatus);

    });

}

function hiddenStatusCallback(hiddenStatus) {
    if (hiddenStatus == true) {
        hideControlsDiv();
    }
}


$.fn.shake = function shake(interval, distance, times) {
    interval = interval || 100;
    distance = distance || 10;
    times = times || 4;

    for (var iter = 0; iter < (times + 1); iter++) {
        //this.animate({ left: ((iter%2==0 ? distance : distance*-1))}, interval);
        this.animate({
            top: ((iter % 2 == 0 ? distance : distance * -1))
        }, interval);
        this.animate({
            top: ''
        }, interval);
    }
}

function userUpdateListener() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {

            //console.log('userUpdateListener');

            if (request.instabot_has_license) {
                instabot_has_license = request.instabot_has_license;

                if (request.igBotUser) {
                    localStorage['gbUserGuid'] = request.igBotUser.user_guid;
                    localStorage['gbFTover'] = false;

                    //console.log('set localStorage to licensed guid (has a license');
                }
            }

            if (request.instabot_install_date || request.instabot_free_trial_time) {
                instabot_install_date = request.instabot_install_date;
                instabot_free_trial_time = request.instabot_free_trial_time;
                clearInterval(freeTrialInterval);
                freeTrialInterval = setInterval(displayFreeTrialTimeLeft, 500);
            }

            if (request.igBotUser) {
                var guidStorage = request.igBotUser.user_guid;
                var ftOver = localStorage['gbFTover'];

                if (guidCookie) {
                    if (guidCookie !== guidStorage) {
                        console.log('guid mismatch!!!');
                        chrome.runtime.sendMessage({
                            "guidCookie": guidCookie,
                            "ftOver": ftOver
                        });
                    }
                }

                if (ftOver == true && $('#iframePurchase').length == 0) {
                    $('#h2FreeTrialTimeLeft').hide();
                    console.log('free trial over!!!');
                    chrome.extension.sendMessage({
                        "ftOver": ftOver
                    });
                }

                if (window.location.href.indexOf('growbotforfollowers.com') > -1 && window.location.href.indexOf('update_payment_info=true') > -1 && window.location.href.indexOf('guid') == -1) {
                    window.location.href = window.location.href + '&buyscreen=true&guid=' + guidStorage;
                }

            }

            if (request.openBuyScreen == true && request.igBotUser) {

                if (request.igBotUser.user_guid) {
                    var guid = request.igBotUser.user_guid;
                } else {
                    var guid = JSON.parse(request.igBotUser).user_guid;
                }

                // must make it so this is not set when clicking the subscribe now link
                localStorage['gbFTover'] = true;


                if (localStorage['gbUserGuid']) {
                    localStorage['gbUserGuid'] = guid;
                    //console.log('set localStorage to guid (opening buy screen');
                }

                $('#iframePurchase').remove();
                $('#igBotMediaQueueContainer').hide();
                $('#igBotQueueContainer').hide().before('<iframe id="iframePurchase" src="https://www.growbotforfollowers.com/?buyscreen=true&guid=' + guid + '"></iframe><div style="text-align:center;">If there is an error above, please <a target="_blank" style="color: #2583cc; text-decoration: underline;" href="https://www.growbotforfollowers.com/?buyscreen=true&guid=' + guid + '">click here to purchase</a></div>');
                $('.igBotInjectedButton').off('click').addClass('disabled');
            }

            if (request.toggleGrowbot == true) {
                toggleControlsDiv();
            }

            if (request.openGrowbot == true) {
                openControlsDiv();
            }

            sendResponse({
                response: 'beep beep'
            });
        }
    );
}

function getBackgroundInfo() {
    if (user && user.viewer && user.viewer.username != null) {
        $.ajax({
                url: '' + urlAcctInfo2 + user.viewer.username,
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                    xhr.setRequestHeader('x-asbd-id', '198387');
                    xhr.setRequestHeader('x-ig-app-id', '936619743392459');
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function(r) {
                var u = extractJSONfromUserPageHTML(r);
                //console.log('here');
                //console.log(u);

                if (!u.edge_followed_by) {
                    outputMessage('Error loading your account.  You may be temporarily blocked by Instagram.  You can try refreshing the page.  If that does not work, please take a break from using Growbot for at least 48 hours.');
                    return false;
                }

                chrome.runtime.sendMessage({
                    "updatewanted": true,
                    "ig_user": user.viewer,
                    "ig_user_account_stats": {
                        "date": new Date().toUTCString(),
                        "followers": u.edge_followed_by.count,
                        "following": u.edge_follow.count,
                        "posts": u.edge_owner_to_timeline_media.count
                    }
                });
            })
            .fail(function(data) {
                chrome.runtime.sendMessage({
                    "updatewanted": true,
                    "ig_user": user.viewer,
                    "ig_user_account_stats": {}
                });
            });
    } else {
        console.log('no viewer info');
    }

}

function dialog(messages, yesCallback, noCallback) {

    $('#igBotDialogQuestion').html(messages.question);

    $('#btnDialogOK').text(messages.yes).off('click.dialogyes').on('click.dialogyes', function() {
        yesCallback();
        document.getElementById('igBotDialog').style.display = 'none'
    });
    $('#btnDialogCancel').text(messages.no).off('click.dialogcancel').on('click.dialogcancel', function() {
        noCallback();
        document.getElementById('igBotDialog').style.display = 'none'
    });

    document.getElementById('igBotDialog').style.display = 'block'
}

(function(global, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports !== "undefined") {
        factory();
    } else {
        var mod = {
            exports: {}
        };
        factory();
        global.FileSaver = mod.exports;
    }
})(this, function() {
    "use strict";

    /*
     * FileSaver.js
     * A saveAs() FileSaver implementation.
     *
     * By Eli Grey, http://eligrey.com
     *
     * License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
     * source  : http://purl.eligrey.com/github/FileSaver.js
     */
    // The one and only way of getting global scope in all environments
    // https://stackoverflow.com/q/3277182/1008999
    var _global = typeof window === 'object' && window.window === window ? window : typeof self === 'object' && self.self === self ? self : typeof global === 'object' && global.global === global ? global : void 0;

    function bom(blob, opts) {
        if (typeof opts === 'undefined') opts = {
            autoBom: false
        };
        else if (typeof opts !== 'object') {
            console.warn('Depricated: Expected third argument to be a object');
            opts = {
                autoBom: !opts
            };
        } // prepend BOM for UTF-8 XML and text/* types (including HTML)
        // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF

        if (opts.autoBom && (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i).test(blob.type)) {
            return new Blob([String.fromCharCode(0xFEFF), blob], {
                type: blob.type
            });
        }

        return blob;
    }

    function download(url, name, opts) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'blob';

        xhr.onload = function() {
            saveAs(xhr.response, name, opts);
        };

        xhr.onerror = function() {
            console.error('could not download file');
        };

        xhr.send();
    }

    function corsEnabled(url) {
        var xhr = new XMLHttpRequest(); // use sync to avoid popup blocker

        xhr.open('HEAD', url, false);
        xhr.send();
        return xhr.status >= 200 && xhr.status <= 299;
    } // `a.click()` doesn't work for all browsers (#465)


    function click(node) {
        try {
            node.dispatchEvent(new MouseEvent('click'));
        } catch (e) {
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
            node.dispatchEvent(evt);
        }
    }

    var saveAs = _global.saveAs || ( // probably in some web worker
        typeof window !== 'object' || window !== _global ? function saveAs() {}
        /* noop */
        // Use download attribute first if possible (#193 Lumia mobile)
        :
        'download' in HTMLAnchorElement.prototype ? function saveAs(blob, name, opts) {
            var URL = _global.URL || _global.webkitURL;
            var a = document.createElement('a');
            name = name || blob.name || 'download';
            a.download = name;
            a.rel = 'noopener'; // tabnabbing
            // detect chrome extensions & packaged apps
            // a.target = '_blank'

            if (typeof blob === 'string') {
                // Support regular links
                a.href = blob;

                if (a.origin !== location.origin) {
                    corsEnabled(a.href) ? download(blob, name, opts) : click(a, a.target = '_blank');
                } else {
                    click(a);
                }
            } else {
                // Support blobs
                a.href = URL.createObjectURL(blob);
                setTimeout(function() {
                    URL.revokeObjectURL(a.href);
                }, 4E4); // 40s

                setTimeout(function() {
                    click(a);
                }, 0);
            }
        } // Use msSaveOrOpenBlob as a second approach
        :
        'msSaveOrOpenBlob' in navigator ? function saveAs(blob, name, opts) {
            name = name || blob.name || 'download';

            if (typeof blob === 'string') {
                if (corsEnabled(blob)) {
                    download(blob, name, opts);
                } else {
                    var a = document.createElement('a');
                    a.href = blob;
                    a.target = '_blank';
                    setTimeout(function() {
                        click(a);
                    });
                }
            } else {
                navigator.msSaveOrOpenBlob(bom(blob, opts), name);
            }
        } // Fallback to using FileReader and a popup
        :
        function saveAs(blob, name, opts, popup) {
            // Open a popup immediately do go around popup blocker
            // Mostly only avalible on user interaction and the fileReader is async so...
            popup = popup || open('', '_blank');

            if (popup) {
                popup.document.title = popup.document.body.innerText = 'downloading...';
            }

            if (typeof blob === 'string') return download(blob, name, opts);
            var force = blob.type === 'application/octet-stream';

            var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari;

            var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);

            if ((isChromeIOS || force && isSafari) && typeof FileReader === 'object') {
                // Safari doesn't allow downloading of blob urls
                var reader = new FileReader();

                reader.onloadend = function() {
                    var url = reader.result;
                    url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;');
                    if (popup) popup.location.href = url;
                    else location = url;
                    popup = null; // reverse-tabnabbing #460
                };

                reader.readAsDataURL(blob);
            } else {
                var URL = _global.URL || _global.webkitURL;
                var url = URL.createObjectURL(blob);
                if (popup) popup.location = url;
                else location.href = url;
                popup = null; // reverse-tabnabbing #460

                setTimeout(function() {
                    URL.revokeObjectURL(url);
                }, 4E4); // 40s
            }
        });
    _global.saveAs = saveAs.saveAs = saveAs;

    if (typeof module !== 'undefined') {
        module.exports = saveAs;
    }
});

function monitorButtonConditions() {

    if (acctsQueue.length > 0 || currentList == 'acctsWhiteList') {
        $('.needsQueueAccts').removeClass('inactive');

        if (currentList == 'acctsWhiteList') {
            $('#btnSaveQueueToStorage').hide();
            $('#btnSaveWhiteList').css({
                'display': 'flex'
            });
        } else {
            $('#btnSaveQueueToStorage').css({
                'display': 'flex'
            });
            $('#btnSaveWhiteList').hide();
        }

        if ($('#igBotQueueContainer input:checked').length > 0) {
            $('.needsSelectedAccts').removeClass('inactive');
        } else {
            $('.needsSelectedAccts').addClass('inactive');
        }
    } else {
        $('.needsQueueAccts,.needsSelectedAccts').addClass('inactive');
    }

    if (timeoutsQueue.length > 0) {
        $('#btnStop').removeClass('inactive').show();
    } else {
        $('#btnStop').addClass('inactive').hide();
    }

    setCurrentPageHashtag();

    clickNotNow();

}

function startUserNameFreshnessInterval() {
    clearInterval(usernameCheckInterval);
    usernameCheckInterval = setInterval(function() {

        if ($('#instabotIcon').length == 0) {
            injectIcon();
            shakeInstabotIcon();
        }

        if ($('#igBotInjectedContainer .pulsing').length > 0) {
            $('#instabotIcon').addClass('pulsing');
        } else {
            $('#instabotIcon').removeClass('pulsing');
        }

        checkUsernameFreshness();
    }, 2000);
}

function clickNotNow() {
    if (gblOptions.clickNotNow == true) {
        var NotNow = $('button:contains("Not Now")');
        if (NotNow.length > 0) {
            outputMessage('Clicked "Not Now" on notifications question');
            NotNow.click();
        }
    }
}

function relinkSubscription() {
    $.post('https://www.growbotforfollowers.com/find_subscription2.php', $('#formRelinkSubscription').serialize()).done(function(data) {
        if (data && data[0] && data[0].subscriptions && data[0].subscriptions.data && data[0].subscriptions.data.length > 0) {
            var guidFromServer = data[0].id;
            chrome.runtime.sendMessage({
                "guidCookie": guidFromServer
            }, function() {
                $('#resultFindSubscription').text('Subscription updated.  Please reload the page.');
            });
        } else {
            $('#resultFindSubscription').text('Cannot find subscription with that information.  Please contact growbotautomator@gmail.com for assistance.');
        }

    });
}


function domReady() {

    //console.log('growbot domready');

    userUpdateListener();

    if (window.location.href.indexOf('.instagram.com') === -1) return false;
    if (window.location.href.indexOf('/developer/') > -1) return false;


    chrome.runtime.sendMessage({
        "updatewanted": true
    });

    waitForWinVars();

}


// Check if the DOMContentLoaded has already been completed
if (document.readyState === 'complete' || document.readyState !== 'loading') {
    domReady();
} else {
    document.addEventListener('DOMContentLoaded', domReady);
}



function arrayOfUsersToDiv(q, clearDiv) {

    if (typeof clearDiv == 'undefined') clearDiv = true;

    if (clearDiv === true) {
        $('#igBotQueueContainer').children().remove();
    } else {
        $('#igBotQueueContainer').children().not('.igBotQueueAcct').remove();
    }

    $('#igBotQueueContainer').append('<table id="gridjsAcctsQueueWrapper"></table>');



    var columns = [{
        name: '✓',
        data: 'id',
        width: '40px',
        formatter: '<input type="checkbox" id="cb_${cell}" value="${cell}" />'
    }, {
        name: 'Pic',
        data: 'profile_pic_url',
        formatter: '<label for="cb_${ig_id}"><img data-ig-userid="${ig_id}" data-src="${cell}" class="igBotQueueAcctProfilePicture"/></label>',
        sort: false,
        width: '62px'
    }, {
        name: '@username',
        data: 'username',
        formatter: '<a href="https://www.instagram.com/${cell}" target="_blank">@${cell}</a>',
        width: '165px'
    }, {
        name: 'Full Name',
        data: 'full_name',
        width: '150px'
    }, {
        name: 'Bio',
        data: 'biography',
        width: '300px'
    }, {
        name: 'Highlights',
        data: 'highlight_reel_count',
        width: '95px'
    }, {
        name: 'Posts',
        data: 'edge_owner_to_timeline_media.count',
        width: '65px'
    }, {
        name: 'Link In Bio',
        data: 'external_url',
        formatter: '<a href="${cell}" target="_blank">${cell}</a>',
        width: '250px'
    }, {
        name: 'Followers',
        data: 'edge_followed_by.count',
        width: '90px'
    }, {
        name: 'Following',
        data: 'edge_follow.count',
        width: '90px'
    }, {
        name: 'Ratio',
        data: 'followRatio',
        width: '65px'
    }, {
        name: 'Mutual',
        data: 'edge_mutual_followed_by.count',
        width: '70px'
    }, {
        name: 'Followed By Me',
        data: 'followed_by_viewer',
        width: '120px'
    }, {
        name: 'Follows Me',
        data: 'follows_viewer',
        width: '95px'
    }, {
        name: 'Requested',
        data: 'requested_by_viewer',
        width: '95px'
    }, {
        name: 'Joined Recently',
        data: 'is_joined_recently',
        width: '100px'
    }, {
        name: 'Private',
        data: 'is_private',
        width: '70px'
    }, {
        name: 'Verified',
        data: 'is_verified',
        width: '70px'
    }, {
        name: 'Business Category',
        data: 'business_category_name',
        width: '150px'
    }, {
        name: 'Pronouns',
        data: 'pronouns',
        width: '90px'
    }, {
        name: 'Last Posted',
        data: 'lastPostDateInDays',
        width: '100px'
    }]


    var sb = '<thead><tr>';

    for (var i = 0; i < columns.length; i++) {
        sb = sb + '<th data-prop="' + columns[i].data + '" style="width:' + (columns[i].width || '60px') + ';">' + columns[i].name + '</th>';
    }

    sb = sb + '</tr></thead><tbody></tbody>';
    $('#gridjsAcctsQueueWrapper').append(sb);



    for (var i = 0; i < q.length; i++) {
        sb = '<tr>';
        for (var j = 0; j < columns.length; j++) {


            if (columns[j].width) {
                sb = sb + '<td style="width:' + columns[j].width + ';">';
            }


            if (columns[j].data) {


                var props = columns[j].data.split('.');

                if (props[1] && q[i].edge_followed_by) {
                    if (q[i][props[0]][props[1]]) {
                        sb = sb + q[i][props[0]][props[1]] + '</td>';
                    } else {
                        sb = sb + '-</td>';
                    }
                } else {
                    if (q[i][props[0]]) {
                        if (columns[j].formatter) {
                            sb = sb + columns[j].formatter.replace(/\${ig_id}/g, q[i].id).replace(/\${cell}/g, q[i][columns[j].data]) + '</td>';
                        } else {

                            var dataString = (q[i][props[0]]);

                            if (typeof dataString === 'number') {
                                dataString = dataString.toFixed(3);
                            }

                            sb = sb + dataString + '</td>';
                        }
                    } else {
                        sb = sb + '-</td>';
                    }
                }


            }
        }
        sb = sb + '</tr>';
        $('#gridjsAcctsQueueWrapper tbody').append(sb);
    }


    $('#gridjsAcctsQueueWrapper').tablesorter({

        // *** APPEARANCE ***
        // Add a theme - 'blackice', 'blue', 'dark', 'default', 'dropbox',
        // 'green', 'grey' or 'ice' stylesheets have all been loaded
        // to use 'bootstrap' or 'jui', you'll need to include 'uitheme'
        // in the widgets option - To modify the class names, extend from
        // themes variable. Look for '$.extend($.tablesorter.themes.jui'
        // at the bottom of this window
        // this option only adds a table class name 'tablesorter-{theme}'
        theme: 'blue',

        // fix the column widths
        widthFixed: true,

        // Show an indeterminate timer icon in the header when the table
        // is sorted or filtered
        showProcessing: true,

        // header layout template (HTML ok); {content} = innerHTML,
        // {icon} = <i/> (class from cssIcon)
        headerTemplate: '{content}{icon}',

        // return the modified template string
        onRenderTemplate: null, // function(index, template){ return template; },

        // called after each header cell is rendered, use index to target the column
        // customize header HTML
        onRenderHeader: function(index) {
            // the span wrapper is added by default
            $(this).find('div.tablesorter-header-inner').addClass('roundedCorners');
        },

        // *** FUNCTIONALITY ***
        // prevent text selection in header
        cancelSelection: true,

        // add tabindex to header for keyboard accessibility
        tabIndex: true,

        // other options: 'ddmmyyyy' & 'yyyymmdd'
        dateFormat: 'yyyymmdd',

        // The key used to select more than one column for multi-column
        // sorting.
        sortMultiSortKey: 'shiftKey',

        // key used to remove sorting on a column
        sortResetKey: 'ctrlKey',

        // false for German '1.234.567,89' or French '1 234 567,89'
        usNumberFormat: true,

        // If true, parsing of all table cell data will be delayed
        // until the user initializes a sort
        delayInit: false,

        // if true, server-side sorting should be performed because
        // client-side sorting will be disabled, but the ui and events
        // will still be used.
        serverSideSorting: false,

        // default setting to trigger a resort after an 'update',
        // 'addRows', 'updateCell', etc has completed
        resort: true,

        // *** SORT OPTIONS ***
        // These are detected by default,
        // but you can change or disable them
        // these can also be set using data-attributes or class names
        headers: {
            // set 'sorter : false' (no quotes) to disable the column
            0: {
                sorter: 'text'
            },
            1: {
                sorter: false
            },
        },

        // ignore case while sorting
        ignoreCase: true,

        // forces the user to have this/these column(s) sorted first
        sortForce: null,
        // initial sort order of the columns, example sortList: [[0,0],[1,0]],
        // [[columnIndex, sortDirection], ... ]
        // sortList: [
        //     [0, 0],
        //     [1, 0],
        //     [2, 0]
        // ],
        sortList: [],
        // default sort that is added to the end of the users sort
        // selection.
        sortAppend: null,

        // when sorting two rows with exactly the same content,
        // the original sort order is maintained
        sortStable: false,

        // starting sort direction 'asc' or 'desc'
        sortInitialOrder: 'asc',

        // Replace equivalent character (accented characters) to allow
        // for alphanumeric sorting
        sortLocaleCompare: false,

        // third click on the header will reset column to default - unsorted
        sortReset: false,

        // restart sort to 'sortInitialOrder' when clicking on previously
        // unsorted columns
        sortRestart: false,

        // sort empty cell to bottom, top, none, zero, emptyMax, emptyMin
        emptyTo: 'bottom',

        // sort strings in numerical column as max, min, top, bottom, zero
        stringTo: 'max',

        // extract text from the table
        textExtraction: {
            0: function(node, table) {
                // this is how it is done by default
                return $(node).attr(table.config.textAttribute) ||
                    node.textContent ||
                    node.innerText ||
                    $(node).text() ||
                    '';
            },
            1: function(node) {
                return $(node).text();
            }
        },

        // data-attribute that contains alternate cell text
        // (used in default textExtraction function)
        textAttribute: 'data-text',

        // use custom text sorter
        // function(a,b){ return a.sort(b); } // basic sort
        textSorter: null,

        // choose overall numeric sorter
        // function(a, b, direction, maxColumnValue)
        numberSorter: null,

        // *** WIDGETS ***
        // apply widgets on tablesorter initialization
        initWidgets: true,

        // table class name template to match to include a widget
        widgetClass: 'widget-{name}',

        // include zebra and any other widgets, options:
        // 'columns', 'filter', 'stickyHeaders' & 'resizable'
        // 'uitheme' is another widget, but requires loading
        // a different skin and a jQuery UI theme.
        widgets: ['pager', 'stickyHeaders', 'storage', 'zebra', 'columns', 'filter'],

        widgetOptions: {

            // zebra widget: adding zebra striping, using content and
            // default styles - the ui css removes the background
            // from default even and odd class names included for this
            // demo to allow switching themes
            // [ 'even', 'odd' ]
            zebra: [
                'ui-widget-content even',
                'ui-state-default odd'
            ],

            // columns widget: change the default column class names
            // primary is the 1st column sorted, secondary is the 2nd, etc
            columns: [
                'primary',
                'secondary',
                'tertiary'
            ],

            // columns widget: If true, the class names from the columns
            // option will also be added to the table tfoot.
            columns_tfoot: true,

            // columns widget: If true, the class names from the columns
            // option will also be added to the table thead.
            columns_thead: true,

            // filter widget: If there are child rows in the table (rows with
            // class name from 'cssChildRow' option) and this option is true
            // and a match is found anywhere in the child row, then it will make
            // that row visible; default is false
            filter_childRows: false,

            // filter widget: If true, a filter will be added to the top of
            // each table column.
            filter_columnFilters: true,

            // filter widget: css class name added to the filter cell
            // (string or array)
            filter_cellFilter: '',

            // filter widget: css class name added to the filter row & each
            // input in the row (tablesorter-filter is ALWAYS added)
            filter_cssFilter: '',

            // filter widget: add a default column filter type
            // '~{query}' to make fuzzy searches default;
            // '{q1} AND {q2}' to make all searches use a logical AND.
            filter_defaultFilter: {},

            // filter widget: filters to exclude, per column
            filter_excludeFilter: {},

            // filter widget: jQuery selector string (or jQuery object)
            // of external filters
            filter_external: '',

            // filter widget: class added to filtered rows;
            // needed by pager plugin
            filter_filteredRow: 'filtered',

            // filter widget: add custom filter elements to the filter row
            filter_formatter: null,

            // filter widget: Customize the filter widget by adding a select
            // dropdown with content, custom options or custom filter functions
            // see http://goo.gl/HQQLW for more details
            filter_functions: null,

            // filter widget: hide filter row when table is empty
            filter_hideEmpty: true,

            // filter widget: Set this option to true to hide the filter row
            // initially. The rows is revealed by hovering over the filter
            // row or giving any filter input/select focus.
            filter_hideFilters: false,

            // filter widget: Set this option to false to keep the searches
            // case sensitive
            filter_ignoreCase: true,

            // filter widget: if true, search column content while the user
            // types (with a delay)
            filter_liveSearch: true,

            // filter widget: a header with a select dropdown & this class name
            // will only show available (visible) options within the drop down
            filter_onlyAvail: 'filter-onlyAvail',

            // filter widget: default placeholder text
            // (overridden by any header 'data-placeholder' setting)
            filter_placeholder: {
                search: '',
                select: ''
            },

            // filter widget: jQuery selector string of an element used to
            // reset the filters.
            filter_reset: null,

            // filter widget: Use the $.tablesorter.storage utility to save
            // the most recent filters
            filter_saveFilters: false,

            // filter widget: Delay in milliseconds before the filter widget
            // starts searching; This option prevents searching for every character
            // while typing and should make searching large tables faster.
            filter_searchDelay: 300,

            // filter widget: allow searching through already filtered rows in
            // special circumstances; will speed up searching in large tables if true
            filter_searchFiltered: true,

            // filter widget: include a function to return an array of values to be
            // added to the column filter select
            filter_selectSource: null,

            // filter widget: Set this option to true if filtering is performed on
            // the server-side.
            filter_serversideFiltering: false,

            // filter widget: Set this option to true to use the filter to find
            // text from the start of the column. So typing in 'a' will find
            // 'albert' but not 'frank', both have a's; default is false
            filter_startsWith: false,

            // filter widget: If true, ALL filter searches will only use parsed
            // data. To only use parsed data in specific columns, set this option
            // to false and add class name 'filter-parsed' to the header
            filter_useParsedData: false,

            // filter widget: data attribute in the header cell that contains
            // the default filter value
            filter_defaultAttrib: 'data-value',

            // filter widget: filter_selectSource array text left of the separator
            // is added to the option value, right into the option text
            filter_selectSourceSeparator: '|',

            // starting page of the pager (zero based index)
            pager_startPage: 0,

            // Number of visible rows - default is 10
            pager_size: gblOptions.paginationLimit,

            // reset pager after filtering; set to desired page #
            // set to false to not change page at filter start
            pager_pageReset: 0,

            // output string - default is '{page}/{totalPages}';
            // possible variables:
            // {page}, {totalPages}, {startRow}, {endRow} and {totalRows}
            // pager_output: '{startRow} to {endRow} ({totalRows})',
            pager_output: '{startRow} - {endRow} / {filteredRows} ({totalRows})',

            // apply disabled classname to the pager arrows when the rows at
            // either extreme is visible - default is true
            pager_updateArrows: true,

            // Number of options to include in the pager number selector
            pager_maxOptionSize: 20,

            // Save pager page & size if the storage script is loaded
            // (requires $.tablesorter.storage in jquery.tablesorter.widgets.js)
            pager_savePages: true,

            // defines custom storage key
            pager_storageKey: 'tablesorter-pager',

            // if true, the table will remain the same height no matter how many
            // records are displayed. The space is made up by an empty
            // table row set to a height to compensate; default is false
            pager_fixedHeight: false,

            // count child rows towards the set page size?
            // (set true if it is a visible table row within the pager)
            // if true, child row(s) may not appear to be attached to its
            // parent row, may be split across pages or
            // may distort the table if rowspan or cellspans are included.
            pager_countChildRows: false,

            // remove rows from the table to speed up the sort of large tables.
            // setting this to false, only hides the non-visible rows; needed
            // if you plan to add/remove rows with the pager enabled.
            pager_removeRows: false,

            // css class names used by pager elements
            pager_css: {
                // class added to pager container
                container: 'tablesorter-pager',
                // error information row (don't include period at beginning)
                errorRow: 'tablesorter-errorRow',
                // class added to arrows @ extremes
                // (i.e. prev/first arrows "disabled" on first page)
                disabled: 'disabled'
            },

            // jQuery selectors
            pager_selectors: {
                // target the pager markup
                container: '.pager',
                // go to first page arrow
                first: '.first',
                // previous page arrow
                prev: '.prev',
                // next page arrow
                next: '.next',
                // go to last page arrow
                last: '.last',
                // go to page selector - select dropdown that sets the current page
                gotoPage: '.gotoPage',
                // location of where the "output" is displayed
                pageDisplay: '.pagedisplay',
                // page size selector - select dropdown that sets the "size" option
                pageSize: '.pagesize'
            },

            // Resizable widget: If this option is set to false, resized column
            // widths will not be saved. Previous saved values will be restored
            // on page reload
            resizable: true,

            // Resizable widget: If this option is set to true, a resizing anchor
            // will be included in the last column of the table
            resizable_addLastColumn: false,

            // Resizable widget: Set this option to the starting & reset header widths
            resizable_widths: [],

            // Resizable widget: Set this option to throttle the resizable events
            // set to true (5ms) or any number 0-10 range
            resizable_throttle: false,

            // saveSort widget: If this option is set to false, new sorts will
            // not be saved. Any previous saved sort will be restored on page
            // reload.
            saveSort: false,

            // stickyHeaders widget: extra class name added to the sticky header row
            stickyHeaders: '',

            // jQuery selector or object to attach sticky header to
            stickyHeaders_attachTo: '#igBotQueueContainer',

            // jQuery selector or object to monitor horizontal scroll position
            // (defaults: xScroll > attachTo > window)
            stickyHeaders_xScroll: null,

            // jQuery selector or object to monitor vertical scroll position
            // (defaults: yScroll > attachTo > window)
            stickyHeaders_yScroll: null,

            // number or jquery selector targeting the position:fixed element
            stickyHeaders_offset: 0,

            // scroll table top into view after filtering
            stickyHeaders_filteredToTop: true,

            // added to table ID, if it exists
            stickyHeaders_cloneId: '-sticky',

            // trigger 'resize' event on headers
            stickyHeaders_addResizeEvent: true,

            // if false and a caption exist, it won't be included in the
            // sticky header
            stickyHeaders_includeCaption: true,

            // The zIndex of the stickyHeaders, allows the user to adjust this
            // to their needs
            stickyHeaders_zIndex: 2

        },

        // *** CALLBACKS ***
        // function called after tablesorter has completed initialization
        initialized: function() {

        }, // function (table) {}

        // *** extra css class names
        tableClass: '',
        cssAsc: '',
        cssDesc: '',
        cssNone: '',
        cssHeader: '',
        cssHeaderRow: '',
        // processing icon applied to header during sort/filter
        cssProcessing: '',

        // class name indiciating that a row is to be attached to the its parent
        cssChildRow: 'tablesorter-childRow',
        // if this class does not exist, the {icon} will not be added from
        // the headerTemplate
        cssIcon: 'tablesorter-icon',
        // class name added to the icon when there is no column sort
        cssIconNone: '',
        // class name added to the icon when the column has an ascending sort
        cssIconAsc: '',
        // class name added to the icon when the column has a descending sort
        cssIconDesc: '',
        // don't sort tbody with this class name
        // (only one class name allowed here!)
        cssInfoBlock: 'tablesorter-infoOnly',
        // class name added to table header which allows clicks to bubble up
        cssAllowClicks: 'tablesorter-allowClicks',
        // header row to ignore; cells within this row will not be added
        // to table.config.$headers
        cssIgnoreRow: 'tablesorter-ignoreRow',

        // *** SELECTORS ***
        // jQuery selectors used to find the header cells.
        selectorHeaders: '> thead th, > thead td',

        // jQuery selector of content within selectorHeaders
        // that is clickable to trigger a sort.
        selectorSort: 'th, td',

        // rows with this class name will be removed automatically
        // before updating the table cache - used by 'update',
        // 'addRows' and 'appendCache'
        selectorRemove: '.remove-me',

        // *** DEBUGING ***
        // send messages to console
        debug: false

    });

    handleCheckBoxes();
    handleImagePreload();

    if (clearDiv == true) {
        // hacky af, get initial load to display saved page size properly
        $('#paginationLimit option:selected').attr("selected", null);
        $('#paginationLimit option[value="' + gblOptions.paginationLimit + '"]').attr("selected", "selected");
        $('#paginationLimit').trigger('change');
        $('#pager img.next').click();
        $('#pager img.prev').click();
    }
}
