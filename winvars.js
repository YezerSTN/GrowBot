/** 
 * Copyright (C) Growbot 2016-2023 - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Growbot <growbotautomator@gmail.com>, 2016-2023
 */
var iterationizations = 0;

function waitForSharedData() {
    iterationizations++;
    if (window._sharedData) {
        localStorage.setItem('winvars', JSON.stringify(window._sharedData));
        //console.log('iterationizations: ' + iterationizations);
    } else {
        setTimeout(waitForSharedData, 1);
    }

}

waitForSharedData();