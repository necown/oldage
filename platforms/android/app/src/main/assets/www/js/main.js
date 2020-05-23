/**
 *
 */
/*
	window.fn = {};

	window.fn.open = function() {
		var menu = document.getElementById('menu');
		menu.open();
	};

	window.fn.load = function(page) {
		var menu = document.getElementById('menu');
		var navi = document.getElementById('navi');

		menu.close();
		navi.resetToPage(page, { animation: 'fade' });
	};
*/
	document.addEventListener('show', function(event) {
		var page = event.target;

		//服薬管理一覧
		if(page.id === 'page-manage-medicine'){

			var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

			console.log("show page-manage-medicine");
			showList(db);

		}
		//病気管理一覧
		if(page.id === 'page-manage-illness'){

			var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

			console.log("show page-manage-medicine");
			showListIllness(db);

		}
	});
   document.addEventListener('deviceready', function(event) {
       console.log("deviceready");

       var epage = document.querySelector('#navi');
       console.log(epage.onDeviceBackButton.isEnabled());
       epage.addEventListener("backbutton",function(){
       		document.querySelector('#navi').popPage();
       },false)


       admob.banner.config({
           id: 'ca-app-pub-2877338582226110/7340925781',
//           id: 'ca-app-pub-3940256099942544/6300978111',//テストID
//           isTesting: true,
           autoShow: true
       });
       admob.banner.prepare();
       setTimeout(admob.banner.show(),3000);
//       admob.banner.show();
       console.log("deviceready end");
   });

	document.addEventListener('init', function(event) {
		var page = event.target;

		//メニューページ
		if (page.id === 'page-home') {
			//情報管理
			page.querySelector('#push-button-manage').onclick = function() {
				document.querySelector('#navi').pushPage('manage.html', {data: {title: '病気の情報の管理'}});
    		};
	    	//年金
			page.querySelector('#push-button-money').onclick = function() {
				document.querySelector('#navi').pushPage('money.html', {data: {title: '年金について'}});
			};
			//介護
			page.querySelector('#push-button-care').onclick = function() {
				document.querySelector('#navi').pushPage('care.html', {data: {title: '介護について'}});
			};
			//相談
			page.querySelector('#push-button-talk').onclick = function() {
				document.querySelector('#navi').pushPage('talk.html', {data: {title: 'しがない主婦のなんでもお聞きしますよ'}});
			};

		//服薬管理一覧
		} else if(page.id === 'page-manage'){

			//登録ボタン
			page.querySelector('#push-button-manage-listToEntry').onclick = function() {

				//ボタンが押されたタブページを取得
				var entrypage = document.querySelector('ons-tab[active]').getAttribute('page');
				console.log('entrypage:'+entrypage);

				if(entrypage == 'manage_medicine.html'){
					document.querySelector('#navi').pushPage('manage_entry.html', {data: {title: '病気の情報の管理'}});
				}else if(entrypage == 'manage_illness.html'){
					document.querySelector('#navi').pushPage('manage_illness_entry.html', {data: {title: '病気の情報の管理'}});
				}
			};

		//服薬情報登録
		} else if(page.id === 'page-manage-entry'){

			backbuttonConfirm();

			displayMedTemp();
			unCheckedSelect('entry-medicine-timing');
			unCheckedSelect('entry-medicine-alarm');
			if(typeof page.data.page_medicine_id === 'undefined'){
				//新規登録の場合
				document.querySelector('#alarmSwitch').checked = false;
				inputSwitch();
			}
			var alarmSwitchOld = document.querySelector('#alarmSwitch').checked;
			console.log("alarmSwitchOld:" + alarmSwitchOld);

			//登録ボタン
			page.querySelector('#push-button-manage-entry').onclick = function() {
				var mname = document.getElementById('entry-medicine-name').value;
				var mtimes = document.getElementById('entry-medicine-times').value;
				var mamount = document.getElementById('entry-medicine-amount').value;
				var munit = document.getElementById('entry-medicine-amount_unit').value;
				var alarmSwitch = document.querySelector('#alarmSwitch').checked;
				var mstart = document.getElementById('entry-medicine-startdate').value;

				var mtiming = selectlistToCsv('entry-medicine-timing');
				var malarm = selectlistToCsv('entry-medicine-alarm');

				var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);
				console.log("db.version:"+db.version);

				var inputData = {
					mname: mname,
					mtimes:	mtimes,
					mamount: mamount,
					munit: munit,
					alarmSwitch: alarmSwitch,
					mstart: mstart,
					mtiming: mtiming,
					malarm: malarm
				};

				var errmes = inputCheck(inputData);
				if(errmes != ""){
					ons.notification.alert({
						messageHTML: '<ul style="text-align:left">' + errmes + '</ul>',
						title: '＜確認してください＞',
						buttonLabel: 'OK',
						animation: 'default'
					});
				}else{

				db.transaction(function(transaction){
//				db.changeVersion('','0.1',function(transaction){

					if(typeof page.data.page_medicine_id === 'undefined'){
						//登録の場合
						transaction.executeSql('INSERT INTO medicine(medicine_name'
								+ ', medicine_times'
								+ ', medicine_amount'
								+ ', medicine_unit'
								+ ', medicine_timing'
								+ ', medicine_alarmSwitch'
								+ ', medicine_alarm'
								+ ') values(?,?,?,?,?,?,?)'
								,[mname,mtimes,mamount,munit,mtiming,alarmSwitch,malarm],
								function(transaction,result){
									//success
									console.log("insert success:"+result.insertId);

									//アラーム登録
									if(alarmSwitch){
										deleteAlarm(result.insertId);
										setTimeout(entryAlarm(result.insertId, mname, mtimes, mstart, malarm, alarmSwitchOld),500);
									}
									document.querySelector('#navi').popPage();

								},
								function(transaction,error){
									//error
									console.warn("error.message:" + error.message);
								});


//						showList(db);
					}else{
						//更新の場合
						transaction.executeSql('REPLACE INTO medicine(id'
								+ ',medicine_name'
								+ ', medicine_times'
								+ ', medicine_amount'
								+ ', medicine_unit'
								+ ', medicine_timing'
								+ ', medicine_alarmSwitch'
								+ ', medicine_alarm'
								+ ') values(?,?,?,?,?,?,?,?)'
								,[page.data.page_medicine_id,mname,mtimes,mamount,munit,mtiming,alarmSwitch,malarm],
								function(transaction,result){
									//success
									console.log("update success:"+page.data.page_medicine_id);

									//アラーム登録
									if(alarmSwitch){
										deleteAlarm(page.data.page_medicine_id);
										setTimeout(entryAlarm(page.data.page_medicine_id, mname, mtimes, mstart, malarm, alarmSwitchOld),500);
									}else{
										deleteAlarm(page.data.page_medicine_id);
									}
									document.querySelector('#navi').popPage();

									showMedicineDetail(page.data.page_medicine_id, 'show');

								},
								function(transaction,error){
									//error
									console.warn(error.message);
								}
						);
					}
				});
//				},
//					function(){
//					//changeVersion success
//						console.log("changeVersion success");
//				},
//					function(error){
//					//changeVersion error
//						console.log(error.message);
//				});

				ons.notification.toast('服用情報を登録しました', {timeout: 3000, animation: 'ascend'});
//				document.querySelector('#navi').popPage();
				}

			};

//			var times = document.getElementById("entry-medicine-times");
//			times.addEventListener("change",function(event){
//
//				if(event.target.value == '頓服'){
//					document.getElementById("input-medicine-times-hour").style.display = "none";
//					document.getElementById("input-medicine-alarm").style.display = "none";
//					document.querySelector('#alarmSwitch').checked = false;
//					var mtimes = document.getElementById('entry-medicine-timing').options;
//					for(var i=0; mtimes.length > i; i++){
//						mtimes[i].selected = false;
//					}
//					var malarm = document.getElementById('entry-medicine-alarm').options;
//					for(var i=0; alarm.length > i; i++){
//						malarm[i].selected = false;
//					}
//
//				}else{
//					document.getElementById("input-medicine-times-hour").style.display = "block";
//					document.getElementById("input-medicine-alarm").style.display = "block";
//				}
//
//			});

		//服薬情報詳細
		} else if(page.id === 'page-manage-detail'){

			//編集ボタン
			page.querySelector('#push-button-manage-edit').onclick = function() {
				document.querySelector('#navi').pushPage('manage_entry.html', {data: {page_medicine_id: page.data.page_medicine_id}});

				showMedicineDetail(page.data.page_medicine_id, 'entry');
			};


			//削除ボタン
			page.querySelector('#push-button-manage-delete').onclick = function() {

				ons.notification.confirm({
					message: '服用情報を削除しますか？',
					title: '＜確認してください＞',
					buttonLabels: [" はい "," いいえ "],
					callback: function(answer){
						if(answer === 0){
							medicineDelete(page.data.page_medicine_id);
							deleteAlarm(page.data.page_medicine_id);
						}
					}
				});
			};


//			page.querySelector('#push-button-manage-deleteAlarm').onclick = function() {
//
//				console.log("deleteAlarm:" + page.data.page_medicine_id);
//
//				deleteAlarm(page.data.page_medicine_id);
//
//			}
			//持病情報登録
		} else if(page.id === 'page-manage-illness-entry'){

			backbuttonConfirm();

			//登録ボタン
			page.querySelector('#push-button-manage-illness-entry').onclick = function() {
				var iname = document.getElementById('entry-illness-name').value;
				var ifrom = document.getElementById('entry-illness-from').value;
				var ihosp = document.getElementById('entry-illness-hospitalname').value;
				var idoc = document.getElementById('entry-illness-doctorname').value;
				var isymp = document.getElementById('entry-illness-symptom').value;


				var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);
				console.log("db.version:"+db.version);

				var inputData = {
					iname: iname,
					ifrom:	ifrom,
					ihosp: ihosp,
					idoc: idoc,
					isymp: isymp
				};

				var errmes = inputCheckIllness(inputData);
				if(errmes != ""){
					ons.notification.alert({
						messageHTML: '<ul style="text-align:left">' + errmes + '</ul>',
						title: '＜確認してください＞',
						buttonLabel: 'OK',
						animation: 'default'
					});
				}else{

				db.transaction(function(transaction){

					if(typeof page.data.page_illness_id === 'undefined'){
						//登録の場合
						transaction.executeSql('INSERT INTO illness(illness_name'
								+ ', illness_from'
								+ ', illness_hospitalname'
								+ ', illness_doctorname'
								+ ', illness_symptom'
								+ ') values(?,?,?,?,?)'
								,[iname,ifrom,ihosp,idoc,isymp],
								function(transaction,result){
									//success
									console.log("insert success:"+result.insertId);

									document.querySelector('#navi').popPage();

								},
								function(transaction,error){
									//error
									console.warn("error.message:" + error.message);
								});


					}else{
						//更新の場合
						transaction.executeSql('REPLACE INTO illness(id'
								+ ',illness_name'
								+ ', illness_from'
								+ ', illness_hospitalname'
								+ ', illness_doctorname'
								+ ', illness_symptom'
								+ ') values(?,?,?,?,?,?)'
								,[page.data.page_illness_id,iname,ifrom,ihosp,idoc,isymp],
								function(transaction,result){
									//success
									console.log("update success:"+page.data.page_illness_id);

									document.querySelector('#navi').popPage();

									showIllnessDetail(page.data.page_illness_id, 'show');

								},
								function(transaction,error){
									//error
									console.warn(error.message);
								}
						);
					}
				});
				ons.notification.toast('持病情報を登録しました', {timeout: 3000, animation: 'ascend'});
				}

			};
			//持病情報詳細
		} else if(page.id === 'page-manage-illness-detail'){

			//編集ボタン
			page.querySelector('#push-button-manage-illness-edit').onclick = function() {
				document.querySelector('#navi').pushPage('manage_illness_entry.html', {data: {page_illness_id: page.data.page_illness_id}});

				showIllnessDetail(page.data.page_illness_id, 'entry');
			};


			//削除ボタン
			page.querySelector('#push-button-manage-illness-delete').onclick = function() {

				ons.notification.confirm({
					message: '病気情報を削除しますか？',
					title: '＜確認してください＞',
					buttonLabels: [" はい "," いいえ "],
					callback: function(answer){
						if(answer === 0){
							illnessDelete(page.data.page_illness_id);
						}
					}
				});
			};


		} else {

		}

	});




var medicineDelete = function(page_medicine_id){
	var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

	db.transaction(function(transaction){
		transaction.executeSql('DELETE FROM medicine WHERE id=?',[page_medicine_id]);
	});

	showList(db);
	document.querySelector('#navi').popPage();
	ons.notification.toast('服用情報を削除しました', {timeout: 3000, animation: 'ascend'});

}

var showMedicineDetail = function(medicine_id, kind){
//	document.querySelector('#navi').pushPage('manage_detail.html', {data: {page_medicine_id: medicine_id}});
	var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

	db.transaction(function(transaction){
		transaction.executeSql('SELECT medicine_name,medicine_times,medicine_amount,medicine_unit,medicine_timing,medicine_alarmSwitch,medicine_alarm FROM medicine WHERE id=?',[medicine_id],
		function(transaction, result){

			var row = result.rows.item(0);

			if(kind === 'entry'){
				document.getElementById('entry-medicine-name').value = row.medicine_name;
				document.getElementById('entry-medicine-times').value = row.medicine_times;
				document.getElementById('entry-medicine-amount').value = row.medicine_amount;
				document.getElementById('entry-medicine-amount_unit').value = row.medicine_unit;
				csvToSelectlist('entry-medicine-timing',row.medicine_timing);
				if(row.medicine_alarmSwitch == 'true'){
					document.querySelector('#alarmSwitch').checked = true;
				}else{
					document.querySelector('#alarmSwitch').checked = false;
				}
				csvToSelectlist('entry-medicine-alarm',row.medicine_alarm);
				displayMedTemp();
				inputSwitch();
			}else if(kind === 'show'){
				document.getElementById('show-medicine-name').textContent = row.medicine_name;
				document.getElementById('show-medicine-times').textContent = row.medicine_times;
				document.getElementById('show-medicine-amount').textContent = "1回 " + row.medicine_amount + " " + row.medicine_unit;
				document.getElementById('show-medicine-timing').textContent = row.medicine_timing;
				console.log("row.medicine_alarmSwitch:" + row.medicine_alarmSwitch);
				if(row.medicine_alarmSwitch == 'true'){
					document.getElementById('show-medicine-alarmSwitch').textContent = "通知する";
				}else{
					document.getElementById('show-medicine-alarmSwitch').textContent = "通知しない";
				}
				document.getElementById('show-medicine-alarm').textContent = row.medicine_alarm;
			}


		});
	});
}

var goMedicineDetail = function(medicine_id){
	document.querySelector('#navi').pushPage('manage_detail.html', {data: {page_medicine_id: medicine_id}});
	showMedicineDetail(medicine_id, 'show');
}


var showList = function(db){
	console.log("method start:showList()");
	console.log("showList():db.version:"+db.version);

	var onsList = document.querySelector('#medicine-list');
	while(onsList.firstChild){
		onsList.removeChild(onsList.firstChild);
	}

			db.transaction(function(transaction){

				transaction.executeSql('CREATE TABLE IF NOT EXISTS medicine(id integer PRIMARY KEY'
						+ ', medicine_name text'
						+ ', medicine_times text'
						+ ', medicine_amount text'
						+ ', medicine_unit text'
						+ ', medicine_timing text'
						+ ', medicine_alarmSwitch text'
						+ ', medicine_alarm text'
						+ ')');
				console.log("create finish");


				transaction.executeSql('SELECT id,medicine_name,medicine_times,medicine_amount,medicine_unit,medicine_timing,medicine_alarmSwitch,medicine_alarm FROM medicine',[],
				function(transaction, result){
					var showstr = "";
					console.log("showList select count:"+result.rows.length);
					for(var i = 0; i < result.rows.length; i++){
						console.log("showList:"+result.rows.item(i).medicine_name);

						var medicineList = document.getElementById('medicine-list');

						var row = result.rows.item(i);

						var bell = "";
						if(row.medicine_alarmSwitch == 'true'){
							bell = "bell-o";
						}else{
							bell = "bell-slash-o";
						}


						var listItemElem = ons.createElement(
										'<ons-list-item '
										+ 'onClick="goMedicineDetail(' + row.id + ')"'
										+ 'data="' + row.id + '"'
										+ 'modifer="chevron" '
										+ 'tappable>'
										+ '<div class="left info-list-icon">'
										+ '<ons-icon class="list-item__icon" icon="fa-medkit"></ons-icon>'
										+ '</div>'
										+ '<div class="center">'
										+ '<span class="list-item__title">'
										+ row.medicine_name
										+ '</span>'
										+ '<span class="list-item__subtitle">'
										+ row.medicine_times + " 1回" + row.medicine_amount + row.medicine_unit
										+ '</span>'
										+ '<span class="list-item__subtitle">'
										+ row.medicine_timing
										+ '</span>'
										+ '</div>'
										+ '<div class="right">'
										+ '<ons-icon class="list-item__icon" icon="' + bell + '"></ons-icon>'
										+ '</div>'
										);


						medicineList.appendChild(listItemElem);


//						var infiniteList = document.getElementById('infinite-list');
//
//						infiniteList.delegate = {
//							createItemContent: function(i){
//								var row = result.rows.item(i);
//
//								var bell = "";
//								if(row.medicine_alarmSwitch == 'true'){
//									bell = "bell-o";
//								}else{
//									bell = "bell-slash-o";
//								}
//
//
//								return ons.createElement(
//										'<ons-list-item '
//										+ 'onClick="goMedicineDetail(' + row.id + ')"'
//										+ 'data="' + row.id + '"'
//										+ 'modifer="chevron" '
//										+ 'tappable>'
//										+ '<div class="left medicine-list-icon">'
//										+ '<ons-icon class="list-item__icon" icon="fa-medkit"></ons-icon>'
//										+ '</div>'
//										+ '<div class="center">'
//										+ '<span class="list-item__title">'
//										+ row.medicine_name
//										+ '</span>'
//										+ '<span class="list-item__subtitle">'
//										+ row.medicine_times + " " + row.medicine_amount + row.medicine_unit
//										+ '</span>'
//										+ '<span class="list-item__subtitle">'
//										+ row.medicine_timing
//										+ '</span>'
//										+ '</div>'
//										+ '<div class="right">'
//										+ '<ons-icon class="list-item__icon" icon="' + bell + '"></ons-icon>'
//										+ '</div>'
//										);
////								return ons.createElement('<ons-list-item onClick="document.querySelector(''#navi'').pushPage(''manage_detail.html'', {data: {page_medicine_id: ' + row.id + '}})" data="' + i + '" tappable>薬の名前：' + row.medicine_name + ' 服薬の頻度：' + row.medicine_times + '</ons-list-item>');
//
//							},
//							countItems: function(){
//								return result.rows.length;
//							}
//						};
//
//						infiniteList.refresh();
					}

					var onsListItem = document.querySelector('#medicine-list > ons-list-item');
					if(!onsListItem){
						console.log("toast toggle");
						//リストがない場合はメッセージを表示する
//						document.getElementById('manage-medicine-toast').toggle();
						ons.notification.toast('右上の「登録」を押して情報を登録してください', {timeout: 3000, animation: 'ascend'});
					}

				}, function(transaction, error){
					//error
					console.log(error.message);
				});
			});


}


function inputCheck(data){

	console.log("data.mname:" + data.mname);
	console.log("data.mtimes:" + data.mtimes);
	console.log("data.mamount:" + data.mamount);
	console.log("data.munit:" + data.munit);
	console.log("data.alarmSwitch:" + data.alarmSwitch);
	console.log("data.mstart:" + data.mstart);
	console.log("data.mtiming:" + data.mtiming);
	console.log("data.malarm:" + data.malarm);

	var mes = "";
	//薬の名前
	if(data.mname == ""){
		mes += "<li>薬の名前を入力してください</li>";
	}
	//服用の頻度
	if(data.mtimes == ""){
		mes += "<li>服用の頻度を入力してください</li>";
	}
	//服用量
	if(data.mamount == "" || data.munit == ""){
		mes += "<li>服用量を入力してください</li>";
	}

	if(data.mtimes != "頓服"){
		//服用時間
		if(data.mtiming == ""){
			mes += "<li>服用時間を入力してください</li>";
		}

		if(data.alarmSwitch == true){
			//アラーム開始
			if(data.mstart == ""){
				mes += "<li>お知らせを開始する日を入力してください</li>";
			}
            var now = new Date();
            now.setHours(00);
            now.setMinutes(00);
            now.setSeconds(00);

            var msatartDate = new Date(data.mstart);
            if(msatartDate < now){
                mes += "<li>お知らせを開始する日は今日以降を入力してください</li>";
            }
			//アラーム時間
			if(data.malarm == ""){
				mes += "<li>お知らせする時間を入力してください</li>";
			}
		}

	}
	console.log(mes);
	return mes;
}



function selectlistToCsv(tagName){

		var ckTag = document.getElementById(tagName);
		var ckTags = ckTag.options;
		var ckText = "";

		for(var j=0; ckTags.length > j; j++){
			if(ckTags[j].selected){
				console.log("selected:" + ckTags[j].value);

				if(ckText == ""){
					ckText = ckTags[j].value;
				}else{
					ckText = ckText + "," + ckTags[j].value;
				}
			}
		}
		return ckText;
}

function csvToSelectlist(tagName, ckText){

	var ckTag = document.getElementById(tagName);
	var array = ckText.split(",");
	var ckTags = ckTag.options;
	console.log("ckTags.length:" + ckTags.length);


	for(var i=0; ckTags.length > i; i++){

		console.log("i,ckTags[i].value:" + i + "," + ckTags[i].value);
		var index = array.indexOf(ckTags[i].value);
		console.log("array[index]:" + array[index]);
		if(index >= 0){
			ckTags[i].selected = true;
		}else{
			ckTags[i].selected = false;
		}
	}

}

function inputSwitch(){

	var alarmsw = document.getElementById("alarmSwitch");
//	if(event.switch.checked){
	if(alarmsw.checked){
		document.getElementById('input-medicine-alarm_on').style.display = "flex";
		document.getElementById('input-medicine-alarm_startdate').style.display = "flex";
		document.getElementById('entry-medicine-alarmOnOff').textContent = "通知する";
	}else{
		document.getElementById('input-medicine-alarm_on').style.display = "none";
		document.getElementById('input-medicine-alarm_startdate').style.display = "none";
		document.getElementById('entry-medicine-alarmOnOff').textContent = "通知しない";
		var malarm = document.getElementById('entry-medicine-alarm').options;
		for(var i=0; malarm.length > i; i++){
			malarm[i].selected = false;
		}

	}
}

function displayMedTemp(){
	var times = document.getElementById("entry-medicine-times");

		if(times.value == '頓服'){
			document.getElementById("input-medicine-times-hour").style.display = "none";
			document.getElementById("input-medicine-alarm").style.display = "none";
			document.querySelector('#alarmSwitch').checked = false;

			unCheckedSelect('entry-medicine-timing');
			unCheckedSelect('entry-medicine-alarm');
//			var mtimes = document.getElementById('entry-medicine-timing').options;
//			for(var i=0; mtimes.length > i; i++){
//				mtimes[i].selected = false;
//			}
//			var malarm = document.getElementById('entry-medicine-alarm').options;
//			for(var i=0; malarm.length > i; i++){
//				malarm[i].selected = false;
//			}

		}else{
			document.getElementById("input-medicine-times-hour").style.display = "block";
			document.getElementById("input-medicine-alarm").style.display = "block";
		}


}

function unCheckedSelect(id){
	var mselect = document.getElementById(id).options;
	for(var i=0; mselect.length > i; i++){
		mselect[i].selected = false;
	}
}

function entryAlarm(_id, mname, mtimes, mstart, malarm, oldSwitch){

//	var noww = new Date().getTime(),
//	_5_sec_from_now = new Date(noww + 10*1000);
//	console.log(_5_sec_from_now);

//	var now = new Date();
//	console.log(now.getFullYear());
//	console.log(now.getMonth());
//	console.log(now.getDate());
//	console.log(now.getHours());
//	console.log(now.getMinutes());

	var dic = {};
	dic['毎日'] = 1;
	dic['1日おき'] = 2;
	dic['2日おき'] = 3;
	dic['3日おき'] = 4;
	dic['4日おき'] = 5;
	dic['5日おき'] = 6;
	dic['6日おき'] = 7;
	dic['7日おき'] = 8;
	dic['8日おき'] = 9;
	dic['9日おき'] = 10;
	dic['10日おき'] = 11;
	dic['11日おき'] = 12;
	dic['12日おき'] = 13;
	dic['13日おき'] = 14;
	dic['14日おき'] = 15;
	dic['15日おき'] = 16;
	dic['16日おき'] = 17;
	dic['17日おき'] = 18;
	dic['18日おき'] = 19;
	dic['19日おき'] = 20;
	dic['20日おき'] = 21;
	dic['21日おき'] = 22;
	dic['22日おき'] = 23;
	dic['23日おき'] = 24;
	dic['24日おき'] = 25;
	dic['25日おき'] = 26;
	dic['26日おき'] = 27;
	dic['27日おき'] = 28;
	dic['28日おき'] = 29;
	dic['29日おき'] = 30;
	dic['30日おき'] = 31;


	var ck = document.getElementById('entry-medicine-alarm').options;
//	console.log("now.toLocaleDateString():" + now.toLocaleDateString());
	console.log("mtimes:" + mtimes);
	//毎日１分ずつずれていくのでひいておく
//	var everyMinutes = (dic[mtimes] * 24 * 60) -1;
	var everyMinutes = (dic[mtimes] * 24 * 60);
	console.log("everyMinutes:" + everyMinutes);


	//ckのselectedごとにアラームをセット
	var count = 0;
	//deleteAlarm(_id);

	for(var i in ck){
		if(ck[i].selected == true){
//			count++;
			var almDate = new Date(mstart + " " + ck[i].value);
			console.log("almDate:" + almDate);

			//初回が過去の時間となってしまう場合は、firstAtを次回の時間にする
			var now = new Date();
			if(now > almDate){
				almDate.setMinutes(almDate.getMinutes() + everyMinutes);
				console.log("almDate:" + almDate);
			}

			//scheduleではfirstAt+everyの時間が初回となってしまうためfirstAtからeveryをひいておく
			almDate.setMinutes(almDate.getMinutes() - everyMinutes);
			console.log("almDate:" + almDate);

			var id = _id*100 + count;
			console.log("id:" + id);

//			if(oldSwitch == false){
				console.log("alarm entry:start");
				//新規登録
				cordova.plugins.notification.local.schedule(
					{
						id: id,
						title: '服用時間のお知らせ',
						text: mname,
						sound: null,
//						at: almDate,
//						firstAt: almDate,
//						every: everyMinutes,
//１						trigger: {after: almDate, every: {hour:22, minute:40, second:0}},
//						trigger: {firstAt: almDate, every: everyMinutes, unit: "minute"},
						trigger: {firstAt: almDate, every: everyMinutes, unit: "minute"},
//						every: 1,
//						unit: "day",
						led: "FF0000",
						foreground: true,
						smallIcon: "res://ic_notify",
						data:{
							test: id
						},
						priority: 2
					}

				);
				console.log("alarm entry:end");

//			}else{
//				console.log("alarm update:start");
				//更新
//				cordova.plugins.notification.local.update(
//					{
//						id: id,
//						title: '服薬時間のお知らせ',
//						text: mname,
//						sound: null,
//						at: almDate,
//						firstAt: almDate,
//						every: everyMinutes,
//１						trigger: {after: almDate, every: {hour:22, minute:40, second:0}},
//						trigger: {firstAt: almDate, every: everyMinutes, unit: "minute"},
//						every: 1,
//						unit: "day",
//						led: "FF0000",
//						foreground: true,
//						smallIcon: "res://ic_launcher",
//						data:{
//							test: id
//						}
//					}
//				);
//				console.log("alarm update:end");
//			}

		}
		count++;
	}

	console.log("entryAlarm"+mname);
//	console.log(cordova.plugins.notification.local.getDefaults());

	cordova.plugins.notification.local.on("schedule",function(notification){
//		alert("scheduled:"+notification.id);
		console.log("scheduled:"+notification.id);
	});
	cordova.plugins.notification.local.on("trigger",function(notification){
//		alert("triggered:"+notification.id);
		console.log("triggered:"+notification.id);
//		var realmDate = new Date();
//		realmDate.setMinutes(realmDate.getMinutes() - everyMinutes);
//		cordova.plugins.notification.local.schedule(
//					{
//						id: id,
//						title: '服用時間のお知らせ',
//						text: mname,
//						sound: null,
//						trigger: {firstAt: realmDate, every: everyMinutes, unit: "minute"},
//						trigger: {firstAt: realmDate, every: 1, unit: "minute"},
//						led: "FF0000",
//						foreground: true,
//						smallIcon: "res://ic_notify",
//						data:{
//							test: id
//						},
//						priority: 2
//					}

//				);
		navigator.vibrate([1000,100,1000,100,1000]);

	});
	cordova.plugins.notification.local.on("click",function(notification){
		console.log("cordova.plugins.notification.local.on.click");
		var id = Math.floor(notification.id / 100);
		console.log("click id:"+id);
		goMedicineDetail(id);
	});

}

function showAlarm(_id){
    for(var count = 0; count < 48; count++){
        var id = _id*100 + count;
        cordova.plugins.notification.local.get(id, function(notifications){
            if(notifications.id){
                alert("id:"+notifications.id);
                alert("text:"+notifications.text);
                var firstAtDate = new Date(notifications.trigger["firstAt"]);
                alert("firstAt:"+firstAtDate);
                alert("every:"+notifications.trigger["every"]);
            }
        });
    }
}

function deleteAlarm(_id){

	console.log("deleteAlarm:" + _id);
	var cancelfun = function(_id){
		var id = _id*100 + count;
		cordova.plugins.notification.local.cancel(id,function(){
			console.log("canceled:"+id);
		});
	}
	for(var count = 0; count < 48; count++){
		setTimeout(cancelfun(_id), 10);
	}

}

function deleteAlarmAll(){

	console.log("deleteAlarmAll:function start");

	cordova.plugins.notification.local.cancelAll(function(){
		console.log("canceledAll");
		alert("canceledAll");
	},this);

}

var dropMedicine = function(){
	var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

	db.transaction(function(transaction){
		transaction.executeSql('DROP TABLE medicine',[],
			function(transaction, result){
				//success
				console.log("success");
			},
			function(transaction, error){
				//error
				console.log("error");
			}
		);
	});
}


function inputCheckIllness(data){

	console.log("data.iname:" + data.iname);
	console.log("data.ifrom:" + data.ifrom);
	console.log("data.ihosp:" + data.ihosp);
	console.log("data.idoc:" + data.idoc);
	console.log("data.isymp:" + data.isymp);

	var mes = "";
	//持病の名前
	if(data.iname == ""){
		mes += "<li>病気の名前を入力してください</li>";
	}
	//いつから
//	if(data.ifrom == ""){
//		mes += "<li>いつ頃からの症状なのか入力してください</li>";
//	}
	//病院名
//	if(data.ihosp == ""){
//		mes += "<li>主治医のいる病院名を入力してください</li>";
//	}
	//主治医
//	if(data.idoc == ""){
//		mes += "<li>主治医の名前を入力してください</li>";
//	}
	//最近の症状
//	if(data.isymp == ""){
//		mes += "<li>最近の症状を入力してください</li>";
//	}
	console.log(mes);
	return mes;
}


var illnessDelete = function(page_illness_id){
	var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

	db.transaction(function(transaction){
		transaction.executeSql('DELETE FROM illness WHERE id=?',[page_illness_id]);
	});

	showListIllness(db);
	document.querySelector('#navi').popPage();
	ons.notification.toast('病気の情報を削除しました', {timeout: 3000, animation: 'ascend'});

}

var showIllnessDetail = function(illness_id, kind){
	var db = openDatabase('medicinedb','','WebSQL DB',1024*1024*10);

	db.transaction(function(transaction){
		transaction.executeSql('SELECT illness_name,illness_from,illness_hospitalname,illness_doctorname,illness_symptom FROM illness WHERE id=?',[illness_id],
		function(transaction, result){

			var row = result.rows.item(0);

			if(kind === 'entry'){
				document.getElementById('entry-illness-name').value = row.illness_name;
				document.getElementById('entry-illness-from').value = row.illness_from;
				document.getElementById('entry-illness-hospitalname').value = row.illness_hospitalname;
				document.getElementById('entry-illness-doctorname').value = row.illness_doctorname;
				document.getElementById('entry-illness-symptom').value = row.illness_symptom;
			}else if(kind === 'show'){
				document.getElementById('show-illness-name').textContent = row.illness_name;
				if(row.illness_from){
					document.getElementById('show-illness-from').textContent = row.illness_from + " 頃から";
				}
				document.getElementById('show-illness-hospitalname').textContent = row.illness_hospitalname;
				if(row.illness_doctorname){
					document.getElementById('show-illness-doctorname').textContent = row.illness_doctorname + " 先生";
				}
				document.getElementById('show-illness-symptom').textContent = row.illness_symptom;
			}


		});
	});
}


var showListIllness = function(db){
	console.log("method start:showListIllness()");
	console.log("showListIllness():db.version:"+db.version);

	var onsList = document.querySelector('#illness-list');
	while(onsList.firstChild){
		onsList.removeChild(onsList.firstChild);
	}

			db.transaction(function(transaction){

				transaction.executeSql('CREATE TABLE IF NOT EXISTS illness(id integer PRIMARY KEY'
						+ ', illness_name text'
						+ ', illness_from text'
						+ ', illness_hospitalname text'
						+ ', illness_doctorname text'
						+ ', illness_symptom text'
						+ ')');
				console.log("create finish");


				transaction.executeSql('SELECT id,illness_name,illness_from,illness_hospitalname,illness_doctorname,illness_symptom FROM illness',[],
				function(transaction, result){
					var showstr = "";
					console.log("showList select count:"+result.rows.length);
					for(var i = 0; i < result.rows.length; i++){
						console.log("showList:"+result.rows.item(i).illness_name);

						var illnessList = document.getElementById('illness-list');

						var row = result.rows.item(i);

						var doctorName =""
						if(row.illness_doctorname){
							doctorName = row.illness_doctorname + " 先生";
						}

						var listItemElem = ons.createElement(
										'<ons-list-item '
										+ 'onClick="goIllnessDetail(' + row.id + ')"'
										+ 'data="' + row.id + '"'
										+ 'modifer="chevron" '
										+ 'tappable>'
										+ '<div class="left info-list-icon">'
										+ '<ons-icon class="list-item__icon" icon="fa-heartbeat"></ons-icon>'
										+ '</div>'
										+ '<div class="center">'
										+ '<span class="list-item__title">'
										+ row.illness_name
										+ '</span>'
										+ '<span class="list-item__subtitle">'
										+ row.illness_hospitalname
										+ '</span>'
										+ '<span class="list-item__subtitle">'
										+ doctorName
										+ '</span>'
										+ '</div>'
										);


						illnessList.appendChild(listItemElem);

					}

					var onsListItem = document.querySelector('#illness-list > ons-list-item');
					if(!onsListItem){
						console.log("toast toggle");
						//リストがない場合はメッセージを表示する
						//document.getElementById('manage-illness-toast').toggle();
						ons.notification.toast('右上の「登録」を押して情報を登録してください', {timeout: 3000, animation: 'ascend'});
					}

				}, function(transaction, error){
					//error
					console.log(error.message);
				});
			});


}

var goIllnessDetail = function(illness_id){
	document.querySelector('#navi').pushPage('manage_illness_detail.html', {data: {page_illness_id: illness_id}});
	showIllnessDetail(illness_id, 'show');
}


function backbuttonConfirm(){
	var epage = document.querySelector('#navi').topPage;
	epage.onDeviceBackButton = function(event){
		ons.notification.confirm({
			message: '編集していた内容は保存されません。前の画面に戻りますか？',
			title: '＜確認してください＞',
			buttonLabels: [" はい "," いいえ "],
			callback: function(answer){
				if(answer === 0){
					document.querySelector('#navi').popPage();
				}
			}
		});
	}

}

