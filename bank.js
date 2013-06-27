money.bank = (function(){
	
	return {
	
		settings: {
		
			enabled: true,
			interest: 0.00,
			minimum_deposit: 0.01,
			minimum_withdraw: 0.01			
			
		},
		
		register: function(){
			money.modules.push(this);
			return this;
		},
	
		init: function(){			
			this.setup();
			
			if(this.settings.enabled){
				if(money.images.bank){
					yootil.bar.add("/bank", money.images.bank, "Bank", "pdmsbank");
				}
			}
			
			if(yootil.location.check.forum() && location.href.match(/\/bank\/?/i)){	
				if(this.settings.enabled){
					this.start();
				} else {
					money.show_default();
				}
			}
		},
		
		start: function(){
			var self = this;
								
			yootil.create.page("bank", "Bank");
			yootil.create.nav_branch("/bank/", "Bank");
			
			var account_number = this.get_account_number();
			var sort_code = this.get_sort_code();
			var html = "";
			
			html += '<div style="display: table"><div style="float: left"><img src="' + money.images.coins + '"></div>';
			
			html += '<div style="display: table-cell; vertical-align: middle; width: 100%">';
			
			html += '<div style="float: right; margin-right: 50px; margin-top: -10px">';
			html += '<strong>Savings Account</strong><br />';
			html += '<span style="font-size: 9px">Account Number: ' + account_number + '</span><br />';
			html += '<span style="font-size: 9px">Sort Code: ' + sort_code + '</span><br /><br />';
			html += '<span style="font-size: 24px; font-weight: bold;">' + money.settings.money_symbol + '<span id="pd_money_bank_balance">' + money.get(true, true) + '</span></span>';
			html += '</div>';
										
			html += '<div style="float: left; margin-left: 60px;">';
			
			html += '<div style="height: 30px"><span style="color: red; display: none; font-size: 11px;" id="pd_money_bank_error"></span></div>';
			
			html += '<div style="line-height: 24px">';
			
			// I know, it's bad, but IE annoyed me.
			var _top = ($.browser.msie)? "0" : "-2";
			
			html += '<input type="text" value="' + money.format(0, true) + '" style="width: 100px; border: 1px solid;" id="pd_money_withdraw">';
			html += '<a id="pd_money_withdraw_button" class="button" href="#" role="button" style="border-top-left-radius: 0px;  border-bottom-left-radius: 0px; margin-right: 50px; position: relative; left: -7px; top: ' + _top + 'px;">Withdraw</a>';
			html += '<input type="text" value="' + money.format(0, true) + '" style="width: 100px; border: 1px solid" id="pd_money_deposit">';
			html += '<a id="pd_money_deposit_button" class="button" href="#" role="button" style="border-top-left-radius: 0px;  border-bottom-left-radius: 0px; position: relative; left: -7px; top: ' + _top + 'px;">Deposit</a>';
			html += '</div>';
			
			html += '</div>';
			
			html += '<br class="clear" />';
	
			html += '</div>';
			html += '</div>';

			var title = '<div>';
			
			title += '<div style="float: left">Bank (Interest Rate: ' + this.settings.interest.toString() + '%)</div>';
			title += '<div style="float: right" id="pd_money_wallet">Wallet: ' + money.settings.money_symbol + '<span id="pd_money_wallet_amount">' + money.get(true) + '</span></div>';
			
			title += '</div><br style="clear: both" />';
			
			var container = yootil.create.container(title, html);
			
			container.find("input#pd_money_deposit").focus(function(){
				$(this).val("");
			});

			container.find("input#pd_money_deposit").blur(function(){
				if(!$(this).val().length){
					$(this).val(money.format(0, true));
				}
			});
			
			container.find("input#pd_money_withdraw").focus(function(){
				$(this).val("");
			});
			
			container.find("input#pd_money_withdraw").blur(function(){
				if(!$(this).val().length){
					$(this).val(money.format(0, true));
				}
			});
							
			container.find("a#pd_money_deposit_button").click(function(){
				var input = container.find("input#pd_money_deposit");
				var value = input.val();
				
				if(parseFloat(value) >= money.format(self.settings.minimum_deposit)){
					var current_amount = money.get(false);
					
					if(value > current_amount){
						self.bank_error("You do not have enough to deposit that amount.");
					} else {
						self.deposit(value);
						input.val(money.format(0, true));
					}
				} else {
					self.bank_error("Deposit value can't be less than " + money.format(self.settings.minimum_deposit, true) + ".");
				}
				
				return false;
			});
			
			container.find("a#pd_money_withdraw_button").click(function(){
				var input = container.find("input#pd_money_withdraw")
				var value = input.val();
				
				if(parseFloat(value) >= money.format(self.settings.minimum_withdraw)){
					var current_amount = money.get(false, true);
					
					if(value > current_amount){
						self.bank_error("You do not have enough in the bank to withdraw that amount.");
					} else {
						self.withdraw(value);
						input.val(money.format(0, true));
					}
				} else {
					self.bank_error("Withdraw value can't be less than " + money.format(self.settings.minimum_withdraw, true) + ".");
				}
				
				return false;
			});
			
			container.show().appendTo("#content").find("div.content");
			
			var trans_html = "";
			
			trans_html += '<table width="100%" style="padding: 0px; text-align: left;" id="pd_money_bank_transaction_list">';
							
			var transactions = this.get_transactions();
			
			if(!transactions.length){
				trans_html += '<tr style="font-size: 10px; height: 25px"><td><em>There are no transactions to view.</td></tr>';
			} else {
				trans_html += this.get_transaction_html_headers();
								
				var counter = 0;
				
				for(var t = 0, l = transactions.length; t < l; t ++){
					var type = "";
					var balance = transactions[t][4];
					
					switch(transactions[t][0]){
					
						case 1 :
							type = "DEPOSIT";
							break;
							
						case 2 :
							type = "WITHDRAW";
							break;
							
						case 3 :
							type = "INTEREST";
							break;
							
						case 4 :
							type = "STAFFEDIT";
							break;
							
					}
					
					var in_amount = (transactions[t][1] > 0)? transactions[t][1] : "--";
					var out_amount = (transactions[t][2] > 0)? transactions[t][2] : "--";
					var date_str = this.format_transaction_date(transactions[t][3]);
					
					trans_html += '<tr style="font-size: 10px; height: 25px">';
					trans_html += '<td>' + date_str + '</td>';
					trans_html += '<td>' + type + '</td>';
					trans_html += '<td>' + yootil.number_format(money.format(in_amount, true)) + '</td>';
					trans_html += '<td>' + yootil.number_format(money.format(out_amount, true)) + '</td>';
					trans_html += '<td>' + yootil.number_format(money.format(balance, true)) + '</td>';
					trans_html += '</tr>';
			
					if(counter < (l - 1)){
						trans_html += '<tr style="height: 5px;"><td colspan="5" style="border-top: 1px solid;"> </td></tr>';
					}
					
					counter ++;
				}
			}
			
			trans_html += '</table>';
   
			yootil.create.container("Last 5 Transactions", trans_html).show().appendTo("#content");//.find("div.content");
		},
		
		setup: function(){
			if(money.plugin){
				var settings = money.plugin.settings;
			
				this.settings.enabled = (settings.bank_enabled == "0")? false : this.settings.enabled;
				this.settings.interest = (settings.interest_rate.toString().length)? settings.interest_rate : "1.00";
				this.settings.minimum_deposit = money.format(settings.minimum_deposit);
				this.settings.minimum_withdraw = money.format(settings.minimum_withdraw);
	
				// Protection incase admin makes a mistake
				
				if(this.settings.minimum_deposit < 1 || this.settings.minimum_deposit < 0.01){
					if(!money.settings.decimal_money){
						this.settings.minimum_deposit = 1;
					} else if(this.settings.minimum_deposit <= 0){
						this.settings.minimum_deposit = 0.01;
					}
				}
				
				if(this.settings.minimum_withdraw < 1 || this.settings.minimum_withdraw < 0.01){
					if(!money.settings.decimal_money){
						this.settings.minimum_withdraw = 1;
					} else if(this.settings.minimum_withdraw <= 0){
						this.settings.minimum_withdraw = 0.01;
					}
				}
			}
		},
		
		apply_interest: function(){
			var balance = money.get(false, true);
			var last_date = money.data.li || "";
			var now = new Date();
			var day = now.getDate();
			var month = (now.getMonth() + 1);
			var year = now.getFullYear();
			var today = (day + "/" + month + "/" + year);

			if(last_date != today){
				this.setup();
				
				var interest = ((balance * parseFloat(this.settings.interest)) / 100);
		
				money.data.li = today;

				if(balance > 0 && interest > 0){
					money.data.b = (parseFloat(balance) + parseFloat(interest.toFixed(2)));
					this.create_transaction(3, interest, 0, true);
				}
			}
		},
		
		format_transaction_date: function(date, format){
			var date = new Date(date);
			var date_str = "";
			var date_obj = {
			
				d: yootil.pad(date.getDate(), 2),
				m: yootil.pad((date.getMonth() + 1), 2),
				y: date.getFullYear()
				
			};
			
			var format = yootil.user.date_format();
			
			if(format.length){
				var parts = format.split("/");
				var date_elems = [];
				
				for(var p = 0, pl = parts.length; p < pl; p ++){
					date_elems.push(date_obj[parts[p]]);
				}
				
				date_str = date_elems.join("/");
			} else {
				date_str = date_obj.d + "/" + date_obj.m + "/" + date_obj.y;
			}
			
			return date_str;	
		},
		
		get_transaction_html_headers: function(){
			var html = "";
			
			html += '<tr id="pd_money_bank_transaction_headers">';
			html += '<th style="width: 20%; text-align: left;">Date</th>';
			html += '<th style="width: 20%; text-align: left;">Type</th>';
			html += '<th style="width: 20%; text-align: left;">In</th>';
			html += '<th style="width: 20%; text-align: left;">Out</th>';
			html += '<th style="width: 20%; text-align: left;">Balance</th>';
			html += '</tr>';
			
			html += '<tr id="pd_money_bank_transaction_headers_dotted"><td colspan="5" style="border-top: 1px dotted; height: 5px;"> </td></tr>';
			
			return html;
		},
		
		bank_error: function(error){
			var elem = $("span#pd_money_bank_error");
		
			if(elem.html() != error){
				elem.stop(true, false);
				elem.html(error).fadeIn("slow").fadeTo(8000, 1).fadeOut("slow", function(){
					elem.html("");
				});
			}
		},
		
		deposit: function(amount){
			amount = money.format(amount);
			
			money.subtract(amount);
			money.add(amount, true);
			
			$("#pd_money_wallet_amount").html(money.get(true));
			$("#pd_money_bank_balance").html(money.get(true, true));
			
			this.create_transaction(1, amount, 0);
		},

		withdraw: function(amount){
			amount = money.format(amount);
			
			money.add(amount);
			money.subtract(amount, true);
			
			$("#pd_money_wallet_amount").html(money.get(true));
			$("#pd_money_bank_balance").html(money.get(true, true));
			
			this.create_transaction(2, 0, amount);
		},
					
		get_account_number: function(){
			var id = yootil.user.id();
			
			return yootil.pad(id, 11, "0");
		},
		
		get_sort_code: function(){
			var str = location.hostname.split(".");
			var sort_code = "";
			var total = 0;

			for(var a = 0, l = str[0].length; a < l; a ++){
				total += str[0].charCodeAt(a);
			}

			total += str[0].length.toString();
			sort_code = yootil.pad(total, 6, "0");
			sort_code = sort_code.replace(/(\d)(?=(\d\d)+(?!\d))/g, "$1-");
			
			return sort_code;
		},
		
		get_transactions: function(other_money_obj){
			var lt = [];
			
			var data = other_money_obj || money.data;
			
			if(data.lt && data.lt.constructor == Array && data.lt.length){
				lt = data.lt;
			}
			
			return lt;
		},
		
		create_transaction: function(type, in_amount, out_amount, skip_key_update, force_previous_balance, other_money_obj){
			var current_transactions = this.get_transactions(other_money_obj);
			var now = +new Date();

			in_amount = money.format(in_amount);
			out_amount = money.format(out_amount);
			
			var total_balance = 0;
			var previous_balance = 0;
			
			if(typeof force_previous_balance == "number"){
				previous_balance = force_previous_balance;
			} else if(current_transactions.length){
				previous_balance = current_transactions[0][4];
			}
			
			total_balance = previous_balance;
			
			if(typeof force_previous_balance != "number"){
				total_balance += (type == 2)? - out_amount : in_amount;
			}
			
			current_transactions.unshift([type, in_amount, out_amount, now, total_balance]);
			
			this.add_new_transaction_row(type, in_amount, out_amount, now, total_balance);
			
			var new_transactions_list = current_transactions.slice(0, 5);
			
			if(type == 4){
				return new_transactions_list;
			}
			
			money.data.lt = new_transactions_list;
			
			if(!skip_key_update){
				yootil.key.set("pixeldepth_money", money.data, null, true);
			}
		},
		
		
		add_new_transaction_row: function(type, in_amount, out_amount, now, balance){
			if($("#pd_money_bank_transaction_headers").length == 0){
				$("#pd_money_bank_transaction_list").empty();
				$("#pd_money_bank_transaction_list").append(this.get_transaction_html_headers());
			}
			
			var trans_html = "";
			var date_str = this.format_transaction_date(now);
			var trans_type = "";
			
			switch(type){
			
				case 1 :
					trans_type = "DEPOSIT";
					break;
					
				case 2 :
					trans_type = "WITHDRAW";
					break;
					
				case 3 :
					trans_type = "INTEREST";
					break;
					
				case 4 :
					type = "STAFFEDIT";
					break;
					
			}
			
			trans_html += '<tr style="font-size: 10px; height: 25px;">';
			trans_html += '<td>' + date_str + '</td>';
			trans_html += '<td>' + trans_type + '</td>';
			trans_html += '<td>' + yootil.number_format(money.format(in_amount, true)) + '</td>';
			trans_html += '<td>' + yootil.number_format(money.format(out_amount, true)) + '</td>';
			trans_html += '<td>' + yootil.number_format(money.format(balance, true)) + '</td>';
			trans_html += '</tr>';
		
			if($("#pd_money_bank_transaction_list tr").length > 2){
				trans_html += '<tr style="height: 5px; display: ;"><td colspan="5" style="border-top: 1px solid;"> </td></tr>';
			}
			
			$(trans_html).hide().insertAfter($("#pd_money_bank_transaction_headers_dotted")).show("fast").fadeIn(3000).css("display", "");
		},
		
		clear_transactions: function(){
			money.data.lt = [];
			yootil.key.set("pixeldepth_money", money.data, null, true);
		},
		
		clear_balance: function(){
			money.clear(true);
		}
		
	};

})().register();