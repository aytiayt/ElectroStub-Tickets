



/* Application Variables */

var db;
var appSettings = {
		currLat: 0,
		currLong: 0,
		userID: 0,
		brandProperty: 'ES',
		dataAPI: 'http://www.electrostub.com/components/ticketAppAPI.cfc',
		online: navigator.onLine || false
	};




$(document).bind('mobileinit', function() {
	
    // Make your jQuery Mobile framework configuration changes here!
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true;
	$.mobile.defaultPageTransition = 'none';
	$.mobile.defaultDialogTransition = 'none';
	$.mobile.useFastClick = true;
	
});

document.addEventListener('deviceready', onDeviceReady, false);

$(document).bind('pageinit', function() {
	
	
	
});


$(function() {
	
	loadPurchasePolicy();
	populateExpMo();
	
	onDeviceReady();

});




function onDeviceReady() {
	
	navigator.geolocation.getCurrentPosition(
		function(position) {
			appSettings.currLat = position.coords.latitude;
			appSettings.currLong = position.coords.longitude;
			loadDefaults();
			//updateLocation(position.coords.latitude,position.coords.longitude);
		},
		function (error) {
			//console.log('code: ' + error.code    + '\n' + 'message: ' + error.message + '\n');
			loadDefaults();
		}
	);
	
	createDB();
	//navigator.network.isReachable('ticketmob.com', reachableCallback);
	
}

function reachableCallback(reachability) {
    // There is no consistency on the format of reachability
    var networkState = reachability.code || reachability;

    var states = {};
    states[NetworkStatus.NOT_REACHABLE]                      = 'No network connection';
    states[NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK] = 'Carrier data connection';
    states[NetworkStatus.REACHABLE_VIA_WIFI_NETWORK]         = 'WiFi connection';

    // console.log('Connection type: ' + states[networkState]);
	if(networkState != 0) { appSettings.online = true; }
}





function createDB() {  
	db = window.openDatabase(appSettings.brandProperty + 'TicketDB', '1.0', appSettings.brandProperty + ' Tickets Local Data Storage', 200000);
	db.transaction(verifDB, dbEmpty, function(){ 
		// success
	});
}
function verifDB(tx) {
	tx.executeSql('SELECT userID FROM userOptions', [], dbNotEmpty, dbEmpty);
}
function dbEmpty(tx) {
	db.transaction(populateDB, errorDB, successCB);
}
function dbNotEmpty(tx, result){
	var userData = result.rows.item(0);
	appSettings.userID = userData.userID;
	loadAccount();
	//console.log(appSettings);
}
function populateDB(tx) {
	tx.executeSql('DROP TABLE IF EXISTS userOptions');
    tx.executeSql('CREATE TABLE IF NOT EXISTS userOptions (id INTEGER PRIMARY KEY AUTOINCREMENT, userID INTEGER)');
    tx.executeSql('INSERT INTO userOptions (userID) VALUES (0)');
}
function errorDB(error) {
	// console.log(error);
}
function successCB() {
	appSettings.userID = 0;
	loadAccount();
};

function updateDB() {
	db.transaction(updateQuery, errorDB);
}
function updateQuery(tx) {
	tx.executeSql('UPDATE userOptions SET userID=:userID', [appSettings.userID], querySuccess, errorDB);
}
function querySuccess(tx, results) {
	//console.log(results);
}




var showAlert = function(title,content) {
	$('h3','#alertBox').html(title);
	$('p','#alertBox').html(content);
	$.mobile.changePage('#alertBox');
}


var updateTotal = function() {
	
	//Updates the subtotal shown on a ticket purchase page by looping through the rows of tickets and determining how many of each ticket is selected.
	
	var subTotal = 0;
	
	$('tr','#showTickets').each(function(i){
		var showTierID = $(this).attr('id').replace('tierRow_','');
		var ticketPrice = parseFloat($('#ticketPrice_'+showTierID).val());
		var ticketQty = parseInt($('#tierQty_'+showTierID).val());
		var ticketPrice = eval(ticketPrice*ticketQty);
		subTotal = eval(subTotal+ticketPrice);
	});
	
	$('span','#buyPageTotal').html(subTotal.toFixed(2));
	
}


var populateExpMo = function() {
	// Get the current year and add 10 years for the year dropdown
	var d = new Date();
	var currentYear = d.getFullYear();
	for (i=currentYear;i<=eval(currentYear+10);i++) {
		$('#expYr').append('<option value="'+i+'">'+i+'</option>');
	}
	
}


var updateCCName = function() {
	$('#cardName').val($('#firstName').val() + ' ' + $('#lastName').val());
}




var toggleSearchLocation = function(option) {
	$('#searchLocation').val(option);
	$('#searchZipContainer').hide();
	if(option=='current') {
		$('#searchLocationCurrent').addClass('ui-btn-active');
		$('#searchLocationZip').removeClass('ui-btn-active');
	} else {
		$('#searchLocationZip').addClass('ui-btn-active');
		$('#searchLocationCurrent').removeClass('ui-btn-active');
		$('#searchZipContainer').show();
	}
}

var searchShows = function() {
	if(($('#searchLocation').val()=='current') && (appSettings.currLat == 0) && (appSettings.currLong == 0)) {
		navigator.geolocation.getCurrentPosition(
			function(position) {
				appSettings.currLat = position.coords.latitude;
				appSettings.currLong = position.coords.longitude;
				doSearch();
				//updateLocation(position.coords.latitude,position.coords.longitude);
			},
			function (error) {
				showAlert('Location Not Found','Please try using zip code search instead.');
			}
		);
	} else {
		doSearch();	
	}
}

var doSearch = function() {
	
	var apiData = {
		brandProperty: appSettings.brandProperty,
		lat: appSettings.currLat,
		long: appSettings.currLong,
		locationType: $('#searchLocation').val(),
		zipcode: $('#searchZip').val(),
		zipcodeRadius: $('#searchZipRadius').val(),
		searchTerms: $('#searchNameArtist').val(),
		dateFrom: $('#searchDateFrom').val(),
		dateTo: $('#searchDateTo').val()
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('showSearch',apiData), function(data) {
	
		if(data.SUCCESS) {
			
			$('#showSearchResults').html(data.HTML).trigger('create');
			
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});

}

var searchArtists = function() {
	
	if($('#searchArtistName').val().length){
		
		var apiData = {
			brandProperty: appSettings.brandProperty,
			searchTerms: $('#searchArtistName').val()
		};
		
		$.mobile.showPageLoadingMsg();
		
		$.getJSON(apiCallURL('artistSearch',apiData), function(data) {
		
			if(data.SUCCESS) {
				
				$('#artistSearchResults').html(data.HTML).trigger('create');
				
			}
			
			$.mobile.hidePageLoadingMsg();
			
		});

	} else {
		
		showAlert('Invalid Search','Please enter an artist name to search.');	
		
	}
	
}

var searchVenues = function() {
	
	if($('#searchVenueName').val().length){
		
		var apiData = {
			brandProperty: appSettings.brandProperty,
			searchTerms: $('#searchVenueName').val()
		};
		
		$.mobile.showPageLoadingMsg();
		
		$.getJSON(apiCallURL('venueSearch',apiData), function(data) {
		
			if(data.SUCCESS) {
				
				$('#venueSearchResults').html(data.HTML).trigger('create');
				
			}
			
			$.mobile.hidePageLoadingMsg();
			
		});

	} else {
		
		showAlert('Invalid Search','Please enter a venue name or city to search.');	
		
	}
	
}



var applyCoupon = function() {

	var apiData = {
		brandProperty: appSettings.brandProperty,
		showTimingID: $('#checkoutShowTimingID').val(),
		showTierList: $('#checkoutShowTierList').val(),
		couponCode: $('#couponCode').val()
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('validateCoupon',apiData), function(data) {
	
		if(data.SUCCESS) {
			
			if(data.VALID) {
				
				$('#checkoutCouponID').val(data.COUPONID);
				updateCart($('#checkoutShowTimingID').val(),$('#checkoutShowTierIDList').val(),$('#checkoutShowTierQtyList').val());
			
			} else {
				
				$('#checkoutCouponID').val(0);
				$('#couponCode').val('');
				checkoutAlert('Invalid Coupon!');
				
				$.mobile.hidePageLoadingMsg();
			}
			
		}
		
	});

}

var removeCoupon = function() {
	
	$('#checkoutCouponID').val(0);
	updateCart($('#checkoutShowTimingID').val(),$('#checkoutShowTierIDList').val(),$('#checkoutShowTierQtyList').val());
	
}



var checkoutAlert = function(msg) {
	
	$('#shoppingCart').prepend('<div class="ui-body ui-body-e messageBox" id="checkoutMessage"><p>'+msg+'</p></div>');
	window.setTimeout(function(){
		$('#checkoutMessage').fadeOut(500,function(){
			$(this).remove();
		});
	},5000);
	
}


var addToCart = function() {

	// Make sure there are some tickets selected
	var showTierIDArr = new Array();
	var showTierQtyArr = new Array();
	
	$('tr','#showTickets').each(function(i){
		var showTierID = $(this).attr('id').replace('tierRow_','');
		var ticketQty = parseInt($('#tierQty_'+showTierID).val());
		if(ticketQty>0){
			showTierIDArr.push(showTierID);
			showTierQtyArr.push(ticketQty);
		}
	});
	
	if(showTierIDArr.length==0) {
		// No tickets selected
		showAlert('Invalid Quantity','Please select a valid quantity of tickets to purchase.');	
		
	} else {
		
		updateCart($('#showTimingID').val(),showTierIDArr.join(),showTierQtyArr.join());
		
	}
	
}

var updateCart = function(showTimingID,showTierIDList,showTierQtyList) {
	
	var apiData = {
		brandProperty: appSettings.brandProperty,
		showTimingID: showTimingID,
		showTierIDList: showTierIDList,
		showTierQtyList: showTierQtyList,
		couponID: $('#checkoutCouponID').val()
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('shoppingCart',apiData), function(data) {
	
		if(data.SUCCESS) {
			
			$('#checkoutShowTierList').val(data.SHOWTIERLIST);
			$('#checkoutShowTierIDList').val(data.SHOWTIERIDLIST);
			$('#checkoutShowTierQtyList').val(data.SHOWTIERQTYLIST);
			$('#checkoutShowTimingID').val(data.SHOWTIMINGID);
			$('#checkoutCouponID').val(data.COUPONID);
			$('#checkoutTotal').val(data.TOTAL);
			$('#checkoutQty').val(data.QTY);
			
			$('#shoppingCart').html(data.CARTDISPLAY).trigger('create');
			
			$.mobile.changePage($('#cartPage'));
			
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}


var doCheckout = function() {
	
	//validate the checkout form
	var errorMsg = '';
	
	// First and Last
	if($('#firstName').val().length==0) {
		errorMsg = errorMsg + 'Please enter your first name<br />';
	}
	if($('#lastName').val().length==0) {
		errorMsg = errorMsg + 'Please enter your last name<br />';	
	}
	// Email
	if (!_CF_checkEmail($('#emailAddress').val(), true)) {
		errorMsg = errorMsg + 'Please enter a valid email address<br />';	
	}
	// Card Name
	if($('#cardName').val().length==0) {
		errorMsg = errorMsg + 'Please enter the name on the credit card<br />';
	}
	// Credit Card
	if (!_CF_checkcreditcard($('#cardNumber').val(), true)) {
		errorMsg = errorMsg + 'Please enter a valid credit card number<br />';
	}
	// Card CVV
	if (!_CF_checkinteger($('#cardCVV').val(), true)) {
		errorMsg = errorMsg + 'Please enter a valid credit card CVV code<br />';
	}
	// Billing Zip
	if (!_CF_checkzip($('#billingZip').val(), true)) {
		errorMsg = errorMsg + 'Please enter a valid billing zip code<br />';
	}
	// Make sure phone is valid if entered
	if (!_CF_checkphone($('#phoneNumber').val(), false)) {
		errorMsg = errorMsg + 'Please enter a valid phone number<br />';
	}
	
	if(errorMsg.length) {
		
		showAlert('Error Completing Purchase',errorMsg);
		
	} else {
		
		//Submit the form
		var apiData = {
			brandProperty: appSettings.brandProperty,
			showTimingID: $('#checkoutShowTimingID').val(),
			showTierList: $('#checkoutShowTierList').val(),
			qty: $('#checkoutQty').val(),
			cardName: $('#cardName').val(),
			cardNumber: $('#cardNumber').val(),
			cardExpiration: $('#expMo').val() + '/' + $('#expYr').val(),
			cardCVV: $('#cardCVV').val(),
			cardZipCode: $('#billingZip').val(),
			checkoutTotal: $('#checkoutTotal').val(),
			customerFirstName: $('#firstName').val(),
			customerLastName: $('#lastName').val(),
			customerEmailAddress: $('#emailAddress').val(),
			customerPhoneNumber: $('#phoneNumber').val(),
			couponID: $('#checkoutCouponID').val()			
		};
		
		$.mobile.showPageLoadingMsg();
		
		$.getJSON(apiCallURL('buyTicket',apiData), function(data) {
		
			if(data.SUCCESS) {
				
				console.log(data);
				if(data.ERROR==0) {
					displayConfirmation(data.TICKETID);
				} else {
					showAlert('Error','An error occured completing your order.<br /><br />'+data.ERRORMSG);	
					$.mobile.hidePageLoadingMsg();
				}
				
			}
			
		});
			
	}
	
}



var displayConfirmation = function(ticketID) {
	
	// Clear out checkout fields
	$('#checkoutShowTierList').val('');
	$('#checkoutShowTierIDList').val('');
	$('#checkoutShowTierQtyList').val('');
	$('#checkoutShowTimingID').val(0);
	$('#checkoutCouponID').val(0);
	$('#checkoutTotal').val(0);
	$('#checkoutQty').val(0);
	$('#firstName').val('');
	$('#lastName').val('');
	$('#emailAddress').val('');
	$('#phoneNumber').val('');
	$('#cardName').val('');
	$('#cardNumber').val('');
	$('#expMo').val(1);
	$('#expYr').val(1);
	$('#billingZip').val('');
	$('#cardCVV').val('');
			
	var apiData = {
		ticketID: ticketID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('ticketDetails',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#confirmationDisplay').html('<h1>Thank you for your order!</h1>'+data.HTML).trigger('create');
			$.mobile.changePage($('#confirmationPage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}


var loadDefaults = function() {
	loadUpcomingShows();
	loadTopArtists();	
	loadTopVenues();	
}


var loadUpcomingShows = function() {

	var apiData = {
		lat: appSettings.currLat,
		long: appSettings.currLong,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('topLocalShows',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#upcomingShows').html(data.HTML).trigger('create');
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}



var loadTopArtists = function() {

	var apiData = {
		lat: appSettings.currLat,
		long: appSettings.currLong,
		brandProperty: appSettings.brandProperty
	};
	
	$.getJSON(apiCallURL('topLocalArtists',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#topArtists').html(data.HTML).trigger('create');
		}
		
	});
	
}



var loadTopVenues = function() {

	var apiData = {
		lat: appSettings.currLat,
		long: appSettings.currLong,
		brandProperty: appSettings.brandProperty
	};
	
	$.getJSON(apiCallURL('topLocalVenues',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#topVenues').html(data.HTML).trigger('create');
		}
		
	});
	
}


var loadAccount = function() {

	if(appSettings.userID==0) {
		$('#accountHeader').html('<h1 class="ui-title" role="heading" aria-level="1">My Account</h1>');
	} else {
		$('#accountHeader').html('<h1 class="ui-title" role="heading" aria-level="1">My Account</h1><a href="#" onclick="doLogout();" class="ui-btn-right ui-btn ui-btn-up-a ui-shadow ui-btn-corner-all ui-btn-icon-left" data-icon="delete" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="a"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Logout</span><span class="ui-icon ui-icon-delete ui-icon-shadow">&nbsp;</span></span></a>');
	}

	var apiData = {
		userID: appSettings.userID,
		brandProperty: appSettings.brandProperty
	};
	
	$.getJSON(apiCallURL('userAccount',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#accountDisplay').html(data.HTML).trigger('create');
		}
		
	});
	
}

var viewOrders = function() {
	
	var apiData = {
		userID: appSettings.userID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('orderHistory',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#orderHistoryDisplay').html(data.HTML).trigger('create');
			$.mobile.changePage($('#orderHistoryPage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}

var viewTicket = function(ticketID) {
	
	var apiData = {
		ticketID: ticketID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('ticketDetails',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#ticketDisplay').html(data.HTML).trigger('create');
			$.mobile.changePage($('#ticketPage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});

	
}


var editAccount = function() {
	
	var apiData = {
		userID: appSettings.userID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('editAccount',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#accountEditDisplay').html(data.HTML).trigger('create');
			$.mobile.changePage($('#accountEditPage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});

}


var updateAccount = function() {
	
	var apiData = {
		userID: appSettings.userID,
		firstName: $('#accountFirstName').val(),
		lastName: $('#accountLastName').val(),
		emailAddress: $('#accountEmailAddress').val(),
		password: $('#accountPassword').val(),
		password2: $('#accountPassword2').val(),
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('updateAccount',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#accountEditDisplay').html(data.HTML).trigger('create');
			$.mobile.silentScroll(0);
			window.setTimeout(function(){
				$('#accountMessage').fadeOut(500,function(){
					$(this).remove();
				});
			},5000);
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});

}


var doLogin = function() {
	
	var apiData = {
		brandProperty: appSettings.brandProperty,
		username: $('#username').val(),
		password: $('#password').val()
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('checkLogin',apiData), function(data) {
	
		if(data.SUCCESS) {
			
			if(data.ERROR==0) {
				appSettings.userID = data.USERID;
				updateDB();
				loadAccount();
			} else {
				$('#password').val('');
				showAlert('Invalid Login',data.ERRORMSG);	
			}
			
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});

}


var doLogout = function() {
	appSettings.userID = 0;
	updateDB();
	loadAccount();
}




var displayShow = function(showTimingID) {
	
	var apiData = {
		showTimingID: showTimingID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('getShow',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#showDisplay').html(data.HTML).trigger('create');
			$.mobile.changePage($('#showPage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}


var displayVenue = function(venueID) {
	
	var apiData = {
		venueID: venueID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('getVenue',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#venueDisplay').html(data.HTML).trigger('create');
			$.mobile.changePage($('#venuePage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}


var displayArtist = function(artistID) {
	
	var apiData = {
		artistID: artistID,
		brandProperty: appSettings.brandProperty
	};
	
	$.mobile.showPageLoadingMsg();
	
	$.getJSON(apiCallURL('getArtist',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#artistDisplay').html(data.HTML).trigger('create');
			$.mobile.changePage($('#artistPage'));
		}
		
		$.mobile.hidePageLoadingMsg();
		
	});
	
}


var loadPurchasePolicy = function(artistID) {
	
	var apiData = {
		brandProperty: appSettings.brandProperty
	};
	
	$.getJSON(apiCallURL('purchasePolicy',apiData), function(data) {
		
		if(data.SUCCESS) {
			$('#purchasePolicyContent').html(data.HTML);
		}
		
	});
	
}


var apiCallURL = function(method,data) {
	
	var queryString = '';
	
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			queryString = queryString + '&' + key + '=' + data[key];
		}
	}
	
	return appSettings.dataAPI+'?method='+method+queryString+'&callback=?';
}



