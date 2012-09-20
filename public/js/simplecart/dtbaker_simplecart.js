/****************************************************************************
Copyright (c) 2009 The Wojo Group

thewojogroup.com
simplecartjs.com
http://github.com/thewojogroup/simplecart-js/tree/master

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
****************************************************************************/

var NextId=1,Custom="Custom",GoogleCheckout="GoogleCheckout",PayPal="PayPal",Email="Email",AustralianDollar=AUD="AUD",CanadianDollar=CAD="CAD",CzechKoruna=CZK="CZK",DanishKrone=DKK="DKK",Euro=EUR="EUR",HongKongDollar=HKD="HKD",HungarianForint=HUF="HUF",IsraeliNewSheqel=ILS="ILS",JapaneseYen=JPY="JPY",MexicanPeso=MXN="MXN",NorwegianKrone=NOK="NOK",NewZealandDollar=NZD="NZD",PolishZloty=PLN="PLN",PoundSterling=GBP="GBP",SingaporeDollar=SGD="SGD",SwedishKrona=SEK="SEK",SwissFranc=CHF="CHF",USDollar=USD="USD";



function Cart(){

	var me = this;
	/* member variables */
	me.Version = '2.0.1';
	me.Shelf = new Shelf();
	me.items = {};
	me.isLoaded = false;
	me.pageIsReady = false;
	me.quantity = 0;
	me.total = 0;
	me.taxRate = 0;
	me.taxCost = 0;
	me.shippingFlatRate = 0;
	me.shippingTotalRate = 0;
	me.shippingQuantityRate = 0;
	me.shippingRate = 0;
	me.shippingCost = 0;
	me.currency = USD;
	me.checkoutTo = PayPal;
	me.email = "";
	me.merchantId	 = "";
	me.cartHeaders = ['Name','Price','Quantity','Total'];
	/* 
		cart headers: 
		you can set these to which ever order you would like, and the cart will display the appropriate headers
		and item info.  any field you have for the items in the cart can be used, and 'Total' will automatically 
		be price*quantity.  
		
		there are keywords that can be used:
			
			1) "_input" - the field will be a text input with the value set to the given field. when the user
				changes the value, it will update the cart.  this can be useful for quantity. (ie "Quantity_input")
			
			2) "increment" - a link with "+" that will increase the item quantity by 1
			
			3) "decrement" - a link with "-" that will decrease the item quantity by 1
			
			4) "remove" - a link that will remove the item from the cart 
			
			5) "_image" or "Image" - the field will be an img tag with the src set to the value. You can simply use "Image" if
				you set a field in the items called "Image".  If you have a field named something else, like "Thumb", you can add
				the "_image" to create the image tag (ie "Thumb_image").
				
			6) "_noHeader" - this will skip the header for that field (ie "increment_noHeader")
		
	
	*/
	
	


	/******************************************************
			add/remove items to cart  
 	 ******************************************************/

	me.add = function () {
		var me=this;
		/* load cart values if not already loaded */
		if( !me.pageIsReady 	) { 
			me.initializeView(); 
			me.update();	
		}
		if( !me.isLoaded 		) { 
			me.load(); 
			me.update();	
		}
		
		var newItem = new CartItem();
		
		/* check to ensure arguments have been passed in */
		if( !arguments || arguments.length === 0 ){
			error( 'No values passed for item.');
			return;
		}
		var argumentArray = arguments;
		if( arguments[0] && typeof( arguments[0] ) != 'string' && typeof( arguments[0] ) != 'number'  ){ 
			argumentArray = arguments[0]; 
		} 
	
		newItem.parseValuesFromArray( argumentArray );
		newItem.checkQuantityAndPrice();
		
		/* if the item already exists, update the quantity */
		if( me.hasItem(newItem) ) {
			var id=me.hasItem(newItem);
			me.items[id].quantity= parseInt(me.items[id].quantity,10) + parseInt(newItem.quantity,10);
		} else {
			me.items[newItem.id] = newItem;
		}	
		
		me.update();
	};
	
	
	me.remove = function( id ){
		var tempArray = {};
		for( var item in this.items ){
			if( item != id ){ 
				tempArray[item] = this.items[item]; 
			}
		}
		this.items = tempArray;
	};
	
	me.empty = function () {
		simpleCart.items = {};
		simpleCart.update();
	};
	
	/******************************************************
			 item accessor functions
     ******************************************************/

	me.find = function (criteria) {
		if( !criteria )
			return null;
		var results = [];
		for( var next in me.items ){
			var item = me.items[next],
				fits = true;
			for( var name in criteria ){
				if( !item[name] || item[name] != criteria[name] )
					fits = false;
			}
			if( fits )
				results.push( me.next )
		}
		return (results.length == 0 ) ? null : results;
	}

	/******************************************************
			 checkout management 
     ******************************************************/

	me.checkout = function() {
		if( simpleCart.quantity === 0 ){
			error("Cart is empty");
			return;
		}
		switch( simpleCart.checkoutTo ){
			case PayPal:
				simpleCart.paypalCheckout();
				break;
			case GoogleCheckout:
				simpleCart.googleCheckout();
				break;
			case Email:
				simpleCart.emailCheckout();
				break;
			default:
				simpleCart.customCheckout();
				break;
		}
	};
	
	me.paypalCheckout = function() {
		
		var me = this,
			winpar = "scrollbars,location,resizable,status",
			strn  = "https://www.paypal.com/cgi-bin/webscr?cmd=_cart" +
		   			"&upload=1" +
		        	"&business=" + me.email + 
					"&currency_code=" + me.currency,
			counter = 1,
			itemsString = "";
			
		
		if( me.taxRate ){
			strn = strn + 
				"&tax_cart=" +  me.currencyStringForPaypalCheckout( me.taxCost );
		}
		
		for( var current in me.items ){
			var item = me.items[current];
			
			var optionsString = "";
			for( var field in item ){
				if( typeof(item[field]) != "function" && field != "id" && field != "price" && field != "quantity" && field != "name" && field != "shipping") {
					optionsString = optionsString + ", " + field + "=" + item[field] ; 
				}
			}
			optionsString = optionsString.substring(2);
			
			itemsString = itemsString 	+ "&item_name_" 	+ counter + "=" + item.name  +
									 	  "&item_number_" 	+ counter + "=" + counter +
										  "&quantity_"		+ counter + "=" + item.quantity +
										  "&amount_"		+ counter + "=" + me.currencyStringForPaypalCheckout( item.price ) + 
										  "&on0_" 			+ counter + "=" + "Options" + 
										  "&os0_"			+ counter + "=" + optionsString;
			counter++;
		}
		
		if( me.shipping() != 0){
			 itemsString = itemsString 	+ "&item_name_" 	+ counter + "=Shipping"  +
									 	  "&item_number_" 	+ counter + "=" + counter +
										  "&quantity_"		+ counter + "=1" + 
										  "&amount_"		+ counter + "=" + me.currencyStringForPaypalCheckout( me.shippingCost );
		}

        // modifications by dtbaker.
        // add the peoples details from the form here.
        if(typeof dtbaker_extra_paypal_vars != 'undefined'){
            for (var i in dtbaker_extra_paypal_vars){
                if( typeof(i) != "function" && typeof(i) != "object" && i != "id" && i != "price" && i != "quantity" && i != "name" && i != "shipping") {
                    itemsString = itemsString + '&' + escape(i) + '=' + escape(dtbaker_extra_paypal_vars[i]);
                }
            }
        }
		
		strn = strn + itemsString ;
        // dont open in new window.
        window.location.href = strn;
		//window.open (strn, "paypal", winpar);
	};

	me.googleCheckout = function() {
		var me = this;
		if( me.currency != USD && me.currency != GBP ){
			error( "Google Checkout only allows the USD and GBP for currency.");
			return;
		} else if( me.merchantId === "" || me.merchantId === null || !me.merchantId ){
			error( "No merchant Id for google checkout supplied.");
			return;
		}

        alert('If you have issues with google checkout please click "Remove Frame" at the top');
		
		var form = document.createElement("form"),
			counter = 1;
		form.style.display = "none";
		form.method = "POST";
        form.target = '_top';
		form.action = "https://checkout.google.com/api/checkout/v2/checkoutForm/Merchant/" + 
						me.merchantId;
		form.acceptCharset = "utf-8";
		
		for( var current in me.items ){
			var item 				= me.items[current];
			form.appendChild( me.createHiddenElement( "item_name_" 		+ counter, item.name		) );
			form.appendChild( me.createHiddenElement( "item_quantity_" 	+ counter, item.quantity 	) );
			form.appendChild( me.createHiddenElement( "item_price_" 		+ counter, item.price		) );
			form.appendChild( me.createHiddenElement( "item_currency_" 	+ counter, me.currency 	) );
			form.appendChild( me.createHiddenElement( "item_tax_rate_" 	+ counter, me.taxRate 	) );
			form.appendChild( me.createHiddenElement( "_charset_"					 , ""				) );
			
			var descriptionString = "";
			
			for( var field in item){
				if( typeof( item[field] ) != "function" && 
									field != "id" 		&& 
									field != "quantity"	&& 
									field != "price" )
				{
						descriptionString = descriptionString + ", " + field + ": " + item[field];				
				}
			}
			descriptionString = descriptionString.substring( 1 );
			form.appendChild( me.createHiddenElement( "item_description_" + counter, descriptionString) );
			counter++;
		}

		if( me.shipping() != 0){
			form.appendChild( me.createHiddenElement( "item_name_" 		+ counter, 'Shipping'		) );
			form.appendChild( me.createHiddenElement( "item_quantity_" 		+ counter, 1		) );
			form.appendChild( me.createHiddenElement( "item_price_" 		+ counter,  parseFloat(me.shippingCost).toFixed(2) 	) );
			form.appendChild( me.createHiddenElement( "item_currency_" 	+ counter, me.currency 	) );
			form.appendChild( me.createHiddenElement( "item_tax_rate_" 	+ counter, me.taxRate 	) );
			form.appendChild( me.createHiddenElement( "_charset_"					 , ""				) );
			form.appendChild( me.createHiddenElement( "item_description_" + counter, 'Shipping') );
		}

		document.body.appendChild( form );
		form.submit();
		document.body.removeChild( form );
	};
	
	
	
	me.emailCheckout = function() {
		return;
	};
	
	me.customCheckout = function() {
		return;
	};




	/******************************************************
				data storage and retrival 
	 ******************************************************/
	
	/* load cart from cookie */
	me.load = function () {
		var me = this;
		/* initialize variables and items array */
		me.items = {};
		me.total = 0.00;
		me.quantity = 0;
		
		/* retrieve item data from cookie */
		if( readCookie('simpleCart') ){
			var data = unescape(readCookie('simpleCart')).split('++');
			for(var x=0, xlen=data.length;x<xlen;x++){
			
				var info = data[x].split('||');
				var newItem = new CartItem();
			
				if( newItem.parseValuesFromArray( info ) ){
					newItem.checkQuantityAndPrice();
					/* store the new item in the cart */
					me.items[newItem.id] = newItem;
				}
 			}
		}
		me.isLoaded = true;
	};
	
	
	
	/* save cart to cookie */
	me.save = function () {
		var dataString = "";
		for( var item in this.items ){
			dataString = dataString + "++" + this.items[item].print();
		}
		createCookie('simpleCart', dataString.substring( 2 ), 30 );
	};
	
	

	
		
	/******************************************************
				 view management 
	 ******************************************************/
	
	me.initializeView = function() {
		var me = this;
		me.totalOutlets 			= getElementsByClassName('simpleCart_total');
		me.quantityOutlets 			= getElementsByClassName('simpleCart_quantity');
		me.cartDivs 				= getElementsByClassName('simpleCart_items');
		me.taxCostOutlets			= getElementsByClassName('simpleCart_taxCost');
		me.taxRateOutlets			= getElementsByClassName('simpleCart_taxRate');
		me.shippingCostOutlets		= getElementsByClassName('simpleCart_shippingCost');
		me.finalTotalOutlets		= getElementsByClassName('simpleCart_finalTotal');
		
		me.addEventToArray( getElementsByClassName('simpleCart_checkout') , simpleCart.checkout , "click");
		me.addEventToArray( getElementsByClassName('simpleCart_empty') 	, simpleCart.empty , "click" );
		
		me.Shelf.readPage();
			
		me.pageIsReady = true;
		
	};
	
	
	
	me.updateView = function() {
		me.updateViewTotals();
		if( me.cartDivs && me.cartDivs.length > 0 ){ 
			me.updateCartView(); 
		}
	};
	
	me.updateViewTotals = function() {
		var outlets = [ ["quantity"		, "none"		] , 
						["total"		, "currency"	] , 
						["shippingCost"	, "currency"	] ,
						["taxCost"		, "currency"	] ,
						["taxRate"		, "percentage"	] ,
						["finalTotal"	, "currency"	] ];
						
		for( var x=0,xlen=outlets.length; x<xlen;x++){
			
			var arrayName = outlets[x][0] + "Outlets",
				outputString;
				
			for( var element in me[ arrayName ] ){
				switch( outlets[x][1] ){
					case "none":
						outputString = "" + me[outlets[x][0]];
						break;
					case "currency":
						outputString = me.valueToCurrencyString( me[outlets[x][0]] );
						break;
					case "percentage":
						outputString = me.valueToPercentageString( me[outlets[x][0]] );
						break;
					default:
						outputString = "" + me[outlets[x][0]];
						break;
				}
				me[arrayName][element].innerHTML = "" + outputString;
			}
		}
	};
	
	me.updateCartView = function() {
		var newRows = [],
			x,newRow,item,current,header,newCell,info,outputValue,option,headerInfo;
		
		/* create headers row */
		newRow = document.createElement('div');
		for( header in me.cartHeaders ){
			newCell = document.createElement('div');
			headerInfo = me.cartHeaders[header].split("_");
			
			newCell.innerHTML = headerInfo[0];
			newCell.className = "item" + headerInfo[0];
			for(x=1,xlen=headerInfo.length;x<xlen;x++){
				if( headerInfo[x].toLowerCase() == "noheader" ){
					newCell.style.display = "none";
				}
			}
			newRow.appendChild( newCell );
			
		}
		newRow.className = "cartHeaders";
		newRows[0] = newRow;
		
		/* create a row for each item in the cart */
		x=1;
		for( current in me.items ){
			newRow = document.createElement('div');
			item = me.items[current];
			
			for( header in me.cartHeaders ){
				
				newCell = document.createElement('div');
				info = me.cartHeaders[header].split("_");
				
				switch( info[0].toLowerCase() ){
					case "total":
						outputValue = me.valueToCurrencyString(parseFloat(item.price)*parseInt(item.quantity,10) );
						break;
					case "increment":
						outputValue = me.valueToLink( "+" , "javascript:;" , "onclick=\"simpleCart.items[\'" + item.id + "\'].increment();\"" );
						break;
					case "decrement":
						outputValue = me.valueToLink( "-" , "javascript:;" , "onclick=\"simpleCart.items[\'" + item.id + "\'].decrement();\"" );
						break;
					case "remove":
						outputValue = me.valueToLink( "Remove" , "javascript:;" , "onclick=\"simpleCart.items[\'" + item.id + "\'].remove();\"" );
						break;
					case "price":
						outputValue = me.valueToCurrencyString( item[ info[0].toLowerCase() ] ? item[info[0].toLowerCase()] : " " );
						break;
					default: 
						outputValue = item[ info[0].toLowerCase() ] ? item[info[0].toLowerCase()] : " ";
						break;
				}	
				
				for( var y=1,ylen=info.length;y<ylen;y++){
					option = info[y].toLowerCase();
					switch( option ){
						case "image":
						case "img":
							outputValue = me.valueToImageString( outputValue );		
							break;
						case "input":
							outputValue = me.valueToTextInput( outputValue , "onchange=\"simpleCart.items[\'" + item.id + "\'].set(\'" + outputValue + "\' , this.value);\""  );
							break;
						case "div":
						case "span":
						case "h1":
						case "h2":
						case "h3":
						case "h4":
						case "p":
							outputValue = me.valueToElement( option , outputValue , "" );
							break;
						case "noheader":
							break;
						default:
							error( "unkown header option: " + option );
							break;
					}
				
				}		  
				newCell.innerHTML = outputValue;
				newCell.className = "item" + info[0];
				newRow.appendChild( newCell );
			}			
			newRow.className = "itemContainer";
			newRows[x] = newRow;
			x++;
		}
		
		
		
		for( current in me.cartDivs ){
			
			/* delete current rows in div */
			var div = me.cartDivs[current];
			while( div.childNodes[0] ){
				div.removeChild( div.childNodes[0] );
			}
			
			for(var j=0, jLen = newRows.length; j<jLen; j++){
				div.appendChild( newRows[j] );
			}
			
			
		}
	};

	me.addEventToArray = function ( array , functionCall , theEvent ) {
		for( var outlet in array ){
			var element = array[outlet];
			if( element.addEventListener ) {
				element.addEventListener(theEvent, functionCall , false );
			} else if( element.attachEvent ) {
			  	element.attachEvent( "on" + theEvent, functionCall );
			}
		}
	};
	
	
	me.createHiddenElement = function ( name , value ){
		var element = document.createElement("input");
		element.type = "hidden";
		element.name = name;
		element.value = value;
		return element;
	};
	
	
	
	/******************************************************
				Currency management
	 ******************************************************/
	
	me.currencySymbol = function() {		
		switch(me.currency){
			case JPY:
				return "&yen;";
			case EUR:
				return "&euro;";
			case GBP:
				return "&pound;";
			case USD:
			case CAD:
			case AUD:
			case NZD:
			case HKD:
			case SGD:
				return "&#36;";
			default:
				return "";
		}
	};
	
	
	me.currencyStringForPaypalCheckout = function( value ){
		if( me.currencySymbol() == "&#36;" ){
			return "$" + parseFloat( value ).toFixed(2);
		} else {
			return "" + parseFloat(value ).toFixed(2);
		}
	};
	
	/******************************************************
				Formatting
	 ******************************************************/
	
	
	me.valueToCurrencyString = function( value ) {
		return parseFloat( value ).toCurrency( me.currencySymbol() );
	};
	
	me.valueToPercentageString = function( value ){
		return parseFloat( 100*value ) + "%";
	};
	
	me.valueToImageString = function( value ){
		if( value.match(/<\s*img.*src\=/) ){
			return value;
		} else {
			return "<img src=\"" + value + "\" />";
		}
	};
	
	me.valueToTextInput = function( value , html ){
		return "<input type=\"text\" value=\"" + value + "\" " + html + " />";
	};
	
	me.valueToLink = function( value, link, html){
		return "<a href=\"" + link + "\" " + html + " >" + value + "</a>";
	};
	
	me.valueToElement = function( type , value , html ){
		return "<" + type + " " + html + " > " + value + "</" + type + ">";
	};
	
	/******************************************************
				Duplicate management
	 ******************************************************/
	
	me.hasItem = function ( item ) {
		for( var current in me.items ) {
			var testItem = me.items[current];
			var matches = true;
			for( var field in item ){
				if( typeof( item[field] ) != "function"	&& 
					field != "quantity"  				&& 
					field != "id" 						){
					if( item[field] != testItem[field] ){
						matches = false;
					}
				}	
			}
			if( matches ){ 
				return current; 
			}
		}
		return false;
	};
	
	
	
	
	/******************************************************
				Cart Update managment
	 ******************************************************/
	
	me.update = function() {
		if( !simpleCart.isLoaded ){
			simpleCart.load();
		} 
		if( !simpleCart.pageIsReady ){
			simpleCart.initializeView();
		}
		me.updateTotals();
		me.updateView();
		me.save();
	};
	
	me.updateTotals = function() {
		me.total = 0 ;
		me.quantity  = 0;
		for( var current in me.items ){
			var item = me.items[current];
			if( item.quantity < 1 ){ 
				item.remove();
			} else if( item.quantity !== null && item.quantity != "undefined" ){
				me.quantity = parseInt(me.quantity,10) + parseInt(item.quantity,10); 
			}
			if( item.price ){ 
				me.total = parseFloat(me.total) + parseInt(item.quantity,10)*parseFloat(item.price); 
			}
		}
		me.shippingCost = me.shipping();
		me.taxCost = parseFloat(me.total)*me.taxRate;
		me.finalTotal = me.shippingCost + me.taxCost + me.total;
	};
	
	me.shipping = function(){
		if( parseInt(me.quantity,10)===0 )
			return 0;
		var shipping = 	parseFloat(me.shippingFlatRate) + 
					  	parseFloat(me.shippingTotalRate)*parseFloat(me.total) +
						parseFloat(me.shippingQuantityRate)*parseInt(me.quantity,10),
			nextItem,
			next;
		for(next in me.items){
			nextItem = me.items[next];
			if( nextItem.shipping ){
				if( typeof nextItem.shipping == 'function' ){
					shipping += parseFloat(nextItem.shipping());
				} else {
					shipping += parseFloat(nextItem.shipping);
				}
			}
		}
		
		return shipping;
	}
	
	me.initialize = function() {
		simpleCart.initializeView();
		simpleCart.load();
		simpleCart.update();
	};
				
}

/********************************************************************************************************
 *			Cart Item Object
 ********************************************************************************************************/

function CartItem() {
	this.id = "c" + NextId++;
}
	CartItem.prototype.set = function ( field , value ){
        if(typeof field == 'undefined')return;
		field = field.toLowerCase();
		if( typeof( this[field] ) != "function" && field != "id" ){
			if( field == "quantity" ){
				value = value.replace( /[^(\d|\.)]*/gi , "" );
				value = value.replace(/,*/gi, "");
				value = parseInt(value,10);
			} else if( field == "price"){
				value = value.replace( /[^(\d|\.)]*/gi, "");
				value = value.replace(/,*/gi , "");
				value = parseFloat( value );
			}
			if( typeof(value) == "number" && isNaN( value ) ){
				error( "Improperly formatted input.");
			} else {
				this[field] = value;
				this.checkQuantityAndPrice();
			}			
		} else {
			error( "Cannot change " + field + ", this is a reserved field.");
		}
		simpleCart.update();
	};
	
	CartItem.prototype.increment = function(){
		this.quantity = parseInt(this.quantity,10) + 1;
		simpleCart.update();
	};
	
	CartItem.prototype.decrement = function(){
		if( parseInt(this.quantity,10) < 2 ){
			this.remove();
		} else {
			this.quantity = parseInt(this.quantity,10) - 1;
			simpleCart.update();
		}
	};
	
	CartItem.prototype.print = function () {
		var returnString = '';
		for( var field in this ) {
			if( typeof( this[field] ) != "function" ) {
				returnString+= escape(field) + "=" + escape(this[field]) + "||";
			}
		}
		return returnString.substring(0,returnString.length-2);
	};
	
	
	CartItem.prototype.checkQuantityAndPrice = function() {
		if( !this.price || this.quantity == null || this.quantity == 'undefined'){ 
			this.quantity = 1;
			error('No quantity for item.');
		} else {
			this.quantity = ("" + this.quantity).replace(/,*/gi, "" );
			this.quantity = parseInt( ("" + this.quantity).replace( /[^(\d|\.)]*/gi, "") , 10); 
			if( isNaN(this.quantity) ){
				error('Quantity is not a number.');
				this.quantity = 1;
			}
		}
				
		if( !this.price || this.price == null || this.price == 'undefined'){
			this.price=0.00;
			error('No price for item or price not properly formatted.');
		} else {
			this.price = ("" + this.price).replace(/,*/gi, "" );
			this.price = parseFloat( ("" + this.price).replace( /[^(\d|\.)]*/gi, "") ); 
			if( isNaN(this.price) ){
				error('Price is not a number.');
				this.price = 0.00;
			}
		}
	};
	
	
	CartItem.prototype.parseValuesFromArray = function( array ) {
		if( array && array.length && array.length > 0) {
			for(var x=0, xlen=array.length; x<xlen;x++ ){
			
				/* ensure the pair does not have key delimeters */
				array[x].replace(/||/, "| |");
				array[x].replace(/\+\+/, "+ +");
			
				/* split the pair and save the unescaped values to the item */
				var value = array[x].split('=');
				if( value.length>1 ){
					if( value.length>2 ){
						for(var j=2, jlen=value.length;j<jlen;j++){
							value[1] = value[1] + "=" + value[j];
						}
					}
					this[ unescape(value[0]).toLowerCase() ] = unescape(value[1]);
				}
			}
			return true;
		} else {
			return false;
		}
	};
	
	CartItem.prototype.remove = function() {
		simpleCart.remove(this.id);
		simpleCart.update();
	};
	


/********************************************************************************************************
 *			Shelf Object for managing items on shelf that can be added to cart
 ********************************************************************************************************/

function Shelf(){
	this.items = {};
}	
	Shelf.prototype.readPage = function () {
		this.items = {};
		var newItems = getElementsByClassName( "simpleCart_shelfItem" );
		for( var current in newItems ){
			var newItem = new ShelfItem();
			this.checkChildren( newItems[current] , newItem );
			this.items[newItem.id] = newItem;
		}
	};
	
	Shelf.prototype.checkChildren = function ( item , newItem) {
		
		for(var x=0;item.childNodes[x];x++){
			
			var node = item.childNodes[x];
			if( node.className && node.className.match(/item_[^ ]+/) ){
				
				var data = /item_[^ ]+/.exec(node.className)[0].split("_");
				
				if( data[1] == "add" || data[1] == "Add" ){
					var tempArray = [];
					tempArray.push( node );
					var addFunction = simpleCart.Shelf.addToCart(newItem.id);
					simpleCart.addEventToArray( tempArray , addFunction , "click");
					node.id = newItem.id;
				} else {
					newItem[data[1]]  = node;
				}
			}		
			if( node.childNodes[0] ){ 
				this.checkChildren( node , newItem );	
			}	
		}
	};
	
	Shelf.prototype.empty = function () {
		this.items = {};
	};
	
	
	Shelf.prototype.addToCart = function ( id ) {
		return function(){
			if( simpleCart.Shelf.items[id]){
				simpleCart.Shelf.items[id].addToCart();
			} else {
				error( "Shelf item with id of " + id + " does not exist.");
			}
		};
	};
	

/********************************************************************************************************
 *			Shelf Item Object
 ********************************************************************************************************/


function ShelfItem(){
	this.id = "s" + NextId++;
}	
	ShelfItem.prototype.remove = function () {
		simpleCart.Shelf.items[this.id] = null;
	};
	
	
	ShelfItem.prototype.addToCart = function () {
		var outStrings = [],valueString;
		for( var field in this ){
			if( typeof( this[field] ) != "function" && field != "id" ){
				valueString = "";
				
				switch(field){
					case "price":
						if( this[field].value ){
							valueString = this[field].value; 
						} else if( this[field].innerHTML ) {
							valueString = this[field].innerHTML;
						}
						/* remove all characters from price except digits and a period */
						valueString = valueString.replace( /[^(\d|\.)]*/gi , "" );
						valueString = valueString.replace( /,*/ , "" );
						break;
					case "image":
						valueString = this[field].src;
						break;
					default:
						if( this[field].value ){
							valueString = this[field].value; 
						} else if( this[field].innerHTML ) {
							valueString = this[field].innerHTML;
						} else if( this[field].src ){
							valueString = this[field].src;
						} else {
							valueString = this[field];
						}
						break;
				}
				outStrings.push( field + "=" + valueString );
			}
		}
		
		simpleCart.add( outStrings );
	};
	


/********************************************************************************************************
 * Thanks to Peter-Paul Koch for these cookie functions (http://www.quirksmode.org/js/cookies.html)
 ********************************************************************************************************/
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}


//*************************************************************************************************
/*
	Developed by Robert Nyman, http://www.robertnyman.com
	Code/licensing: http://code.google.com/p/getelementsbyclassname/
*/	
var getElementsByClassName = function (className, tag, elm){
	if (document.getElementsByClassName) {
		getElementsByClassName = function (className, tag, elm) {
			elm = elm || document;
			var elements = elm.getElementsByClassName(className),
				nodeName = (tag)? new RegExp("\\b" + tag + "\\b", "i") : null,
				returnElements = [],
				current;
			for(var i=0, il=elements.length; i<il; i+=1){
				current = elements[i];
				if(!nodeName || nodeName.test(current.nodeName)) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	else if (document.evaluate) {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = "",
				xhtmlNamespace = "http://www.w3.org/1999/xhtml",
				namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace : null,
				returnElements = [],
				elements,
				node;
			for(var j=0, jl=classes.length; j<jl; j+=1){
				classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]";
			}
			try	{
				elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
			}
			catch (e) {
				elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
			}
			while ((node = elements.iterateNext())) {
				returnElements.push(node);
			}
			return returnElements;
		};
	}
	else {
		getElementsByClassName = function (className, tag, elm) {
			tag = tag || "*";
			elm = elm || document;
			var classes = className.split(" "),
				classesToCheck = [],
				elements = (tag === "*" && elm.all)? elm.all : elm.getElementsByTagName(tag),
				current,
				returnElements = [],
				match;
			for(var k=0, kl=classes.length; k<kl; k+=1){
				classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
			}
			for(var l=0, ll=elements.length; l<ll; l+=1){
				current = elements[l];
				match = false;
				for(var m=0, ml=classesToCheck.length; m<ml; m+=1){
					match = classesToCheck[m].test(current.className);
					if (!match) {
						break;
					}
				}
				if (match) {
					returnElements.push(current);
				}
			}
			return returnElements;
		};
	}
	return getElementsByClassName(className, tag, elm);
};


/********************************************************************************************************
 *  Helpers
 ********************************************************************************************************/


String.prototype.reverse=function(){return this.split("").reverse().join("");};
Number.prototype.withCommas=function(){var x=6,y=parseFloat(this).toFixed(2).toString().reverse();while(x<y.length){y=y.substring(0,x)+","+y.substring(x);x+=4;}return y.reverse();};
Number.prototype.toCurrency=function(){return(arguments[0]?arguments[0]:"$")+this.withCommas();};


/********************************************************************************************************
 * error management 
 ********************************************************************************************************/

function error( message ){
	try{ 
		console.log( message ); 
	}catch(err){ 
	//	alert( message );
	}
}


var simpleCart = new Cart();

if( typeof jQuery !== 'undefined' ) $(document).ready(function(){simpleCart.initialize();}); 
else if( typeof Prototype !== 'undefined') Event.observe( window, 'load', function(){simpleCart.initialize();});
else window.onload = simpleCart.initialize;




var dtbaker_extra_paypal_vars = [];
function dtbaker_simpleCart(options){
    var t = this;
    t.options = options;
    t.holder = $('#'+options.id);

    t.init = function(){

       
        var t = this;
        if(typeof t.options.currency != 'undefined'){
            simpleCart.currency = t.options.currency;
        }
        if(typeof t.options.paypal == 'undefined' || !t.options.paypal){
            $('label[for=payment_paypal]',t.holder).hide();
        }
        if(typeof t.options.google == 'undefined' || !t.options.google){
            $('label[for=payment_google]',t.holder).hide();
        }
        if(typeof t.options.email == 'undefined' || !t.options.email){
            $('label[for=payment_email]',t.holder).hide();
        }


        t.refresh();
        $('.quantity',t.holder).change(function(){
            t.refresh();
        });
        $('.quantity',t.holder).keyup(function(){
            t.refresh();
        });
        $('.shipping_cost',t.holder).change(function(){
            t.refresh();
        });
        $('.submit_order',t.holder).click(function(){
            //alert('If you have issues with Google Checkout in this demo please click "Remove Frame" from the top');
            t.do_checkout();
        });
    };

    t.refresh = function(){
        var t = this;
        t.do_add_to_cart();
        $('.cart_summary',t.holder).html(simpleCart.currencySymbol() + parseFloat(simpleCart.finalTotal).toFixed(2));
    };

    t.send_email = function(checkout_after){
        var t = this;
        // email store owner about their purchase.
        // submit this form via ajax
        $('form.shop_form',t.holder).each(function(){
            $(this).attr('action','php/simplecart_email.php');
            $(this).attr('target','dtbaker_shop_hidden_iframe');
            $('#dtbaker_shop_hidden_iframe').remove();
            $('body').append('<iframe src="about:blank" id="dtbaker_shop_hidden_iframe" name="dtbaker_shop_hidden_iframe" width="0" height="0" frameborder="0" style="display:none;"></iframe>');
            $(this).prepend('<input type="hidden" name="checkout_method" value="'+simpleCart.checkoutTo+'" />');
            $(this).append('<input type="hidden" name="redirect" value="'+escape(t.options.thank_you_url)+'" />');
            $(this).append('<input type="hidden" name="dtbaker_checkout_callback" value="' + (checkout_after ? 'simpleCart.checkout();' : '') + '" />');
            $(this).append('<input type="hidden" name="total_order_price" value="' + simpleCart.currencySymbol() + parseFloat(simpleCart.finalTotal).toFixed(2) + '" />');
            var form = $(this)[0];
            var me = simpleCart;
            var counter = 1;
            for( var current in me.items ){
                var item 				= me.items[current];
                form.appendChild( me.createHiddenElement( "item_name_" 		+ counter, item.name		) );
                form.appendChild( me.createHiddenElement( "item_quantity_" 	+ counter, item.quantity 	) );
                form.appendChild( me.createHiddenElement( "item_price_" 		+ counter, item.price		) );
                form.appendChild( me.createHiddenElement( "item_currency_" 	+ counter, me.currency 	) );
                form.appendChild( me.createHiddenElement( "item_tax_rate_" 	+ counter, me.taxRate 	) );
                var descriptionString = "";
                for( var field in item){
                    if( typeof( item[field] ) != "function" &&
                                        field != "id" 		&&
                                        field != "quantity"	&&
                                        field != "price" )
                    {
                            descriptionString = descriptionString + ", " + field + ": " + item[field];
                    }
                }
                descriptionString = descriptionString.substring( 1 );
                form.appendChild( me.createHiddenElement( "item_description_" + counter, descriptionString) );
                counter++;
            }

            if( me.shipping() != 0){
                form.appendChild( me.createHiddenElement( "item_name_" 		+ counter, 'Shipping'		) );
                form.appendChild( me.createHiddenElement( "item_quantity_" 		+ counter, 1		) );
                form.appendChild( me.createHiddenElement( "item_price_" 		+ counter, parseFloat(me.shippingCost ).toFixed(2) 	) );
                form.appendChild( me.createHiddenElement( "item_currency_" 	+ counter, me.currency 	) );
                form.appendChild( me.createHiddenElement( "item_tax_rate_" 	+ counter, me.taxRate 	) );
                form.appendChild( me.createHiddenElement( "item_description_" + counter, 'Shipping') );
            }
            $(this)[0].submit();
        });
        /*$.post("php/simplecart_email.php" , {
            cart: simpleCart.items,
            shipping: (simpleCart.shipping() != 0 ? simpleCart.shippingCost : 0),
            method: simpleCart.checkoutTo
        } , function(data) {
            alert( data );
            if(checkout_after){
                simpleCart.checkout();
            }
        });*/
    };

    t.do_add_to_cart = function(){
        var t = this;
        simpleCart.empty();
        // find out shipping price.
        var shipping_price = parseFloat($('.shipping_cost',t.holder).val());
        if(typeof t.options.shipping_rate != 'undefined' && parseFloat(t.options.shipping_rate) > 0){
            shipping_price = t.options.shipping_rate;
        }
        if(shipping_price > 0){
            if(t.options.flat_rate){
                simpleCart.shippingFlatRate = shipping_price;
            }else{
                simpleCart.shippingQuantityRate = shipping_price;
            }
        }
        simpleCart.add('name='+t.options.product_name,'price='+t.options.product_price,'quantity='+Math.max(1,$('.quantity',t.holder).val()));
    };

    t.do_checkout = function(){
        var t = this;
        // check for all required fields:
        var email_address = $('[name=email]',t.holder).val();
        var filter=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
        if (email_address == '' || !filter.test(email_address)){
            alert('Please enter a valid email address');
            return false;
        }
        var run_checkout = true;
        // choose payment method
        if(typeof t.options.paypal != 'undefined' && t.options.paypal != '' && $('label[for=payment_paypal] input',t.holder)[0].checked){
            simpleCart.email = t.options.paypal;
            simpleCart.checkoutTo = PayPal;
            dtbaker_extra_paypal_vars = [];
            dtbaker_extra_paypal_vars['address1'] = '';
            dtbaker_extra_paypal_vars['city'] = '';
            dtbaker_extra_paypal_vars['country'] = '';
            dtbaker_extra_paypal_vars['email'] = '';
            dtbaker_extra_paypal_vars['first_name'] = '';
            //dtbaker_extra_paypal_vars['last_name'] = '';
            dtbaker_extra_paypal_vars['state'] = '';
            dtbaker_extra_paypal_vars['zip'] = '';
            for(var i in dtbaker_extra_paypal_vars){
                // find this value in the form.
                dtbaker_extra_paypal_vars[i] = $('[name='+i+']',t.holder).val();
            }
        }else if(typeof t.options.google != 'undefined' && t.options.google != '' && $('label[for=payment_google] input',t.holder)[0].checked){
            simpleCart.merchantId = t.options.google;
            simpleCart.checkoutTo = GoogleCheckout;
        }else if(typeof t.options.email != 'undefined' && t.options.email && $('label[for=payment_email] input',t.holder)[0].checked){
            run_checkout = false;
            simpleCart.checkoutTo = Email;
            simpleCart.emailCheckout = function(){
                /* var div = document.createElement("div");
                this.cartDivs[0] = div;
                simpleCart.updateCartView();
                var html = cartDivs[0].innerHTML; */
                // display a thankyou page.
                window.location.href=t.options.thank_you_url;
            };
        }else{
            alert('Please select a checkout method');
            return false;
        }

        t.do_add_to_cart();
        // send our order email off to let the owner know one is on it's way:
        t.send_email(run_checkout);
        //simpleCart.checkout();
    };

    t.init();

}