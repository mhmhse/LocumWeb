var lmConstants = {	
    alpha: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],

/*    baseUrl: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/',*/
    baseUrl: 'http://pupfish01.internal.bmjgroup.com:8081/locumservice/',

    //======================= Constants
    version: '1.7.4',
    mrcpPart1: 1,
	
	emqAdditionalAnswer: '{{AdditionalAnswer}}'
};



//## Global object OE --- to be persisted to file or local storage
var lm = {
    //======================= Properties
    //## User
    auth: new Auth(),

    //## Sessions
    sessions: new Sessions(),

    //## Flag to download images
    downloadImages: true,


    //======================= Methods
    addAjaxOptions: function (options) {
        //return _.extend(options, { timeout: 5000, dataType: 'jsonp' });			//## Enable for Chrome testing
        return _.extend(options,
                        {
                            contentType: 'application/json; charset=utf-8',
                            dataType: 'json',
                            type: 'POST',
                            cache: false
                        }); 					//## Enable for Cordova testing
    },


    ajax: function (serviceName, data, successFunc, errorFunc) {
        appLib.maskUI(true);

        appLib.log(JSON.stringify(data));
		
		// POST cache problem with iOS6
		var currentTime = new Date();
		var cacheBuster = currentTime.getTime();
        
		var options = {
            url: lmConstants.baseUrl + serviceName + '?cacheBuster=' + cacheBuster,
            data: JSON.stringify(data),
            success: function (data, textStatus) {

                appLib.maskUI(false);

                appLib.log('Ajax success');
                appLib.log(data);
                
                successFunc(data, textStatus);
                
            },
            error: function (xhr, msg, err) {

                appLib.maskUI(false);

                appLib.log('Ajax error: ' + err + ' (' + msg + ')');
                appLib.log(xhr);
                errorFunc(xhr, msg, err);
            }
        };

		options = lm.addAjaxOptions(options);

        jQuery.ajax(options);
    },



    reset: function () {
        this.auth.reset();
        this.sessions.reset();

        //## Delete saved data
        window.localStorage.removeItem('lm');
    },

    startNewSession: function (showAnswers, showTimer) {

        //## Clear all sessions
        this.sessions.reset();


        //## Add a new session
        this.sessions.add(new Session({
        }));
    },

    /* Session can only be ended by uploading answers and getting new questions
    endCurrentSession: function() {
    this.currentSession().set('completed', true);
    },
    */

    currentSession: function () {
        if (this.sessions.length == 0)
            return null;

        return this.sessions.at(this.sessions.length - 1);
    },

    getCurrentSessionOrNewSession: function () {

        if (this.currentSession() == null) {

            this.startNewSession();
        }
        return this.currentSession();
    },

    search: function (parameters) {
        
        if (parameters == null) {

            parameters = this.getCurrentSessionOrNewSession().get("searchParameter");
        }

        lm.ajax('search',
				{
				    searchType: parameters.searchType,
				    grade: parameters.grade,
				    specialty: parameters.specialty,
				    postcode: parameters.postcode,
				    range: parameters.range
				},
				function (data, textStatus) {

				    if (!_.isUndefined(data) && !_.isUndefined(data.valid)) {

				        //TODO
				        return data;
				    }
				    return null;
				},
				function (xhr, msg, errorText) {
				    alert("can't access webservice");
				});

    },

    penddingStampOnImg: function (imgdiv, operationType) {

        if (imgdiv) {

            if (operationType == LocumOperationType.Accepted) {

                imgdiv.append('<div class="status like">Save!</div>');

            } else if (operationType == LocumOperationType.Denied) {


                imgdiv.append('<div class="status dislike">Discard!</div>');
            }
        }

    },



    //## Load / Save data
    load: function () {
        var json = window.localStorage.getItem('lm');
        if (json == null)
            return;

        var data = JSON.parse(json);

        this.auth = new Auth(data.auth);
        this.sessions = new Sessions(data.sessions);
        this.questionBank = new QuestionBank(data.questionBank);

        this.assessmentId = data.assessmentId;
        this.selectedExamId = data.selectedExamId;

    },

    save: function () {
        window.localStorage.setItem('lm', JSON.stringify(this));
    },

    isLoginExpired: function (msg) {
        if (msg.indexOf('Invalid token') >= 0) {
            appLib.alert('Your session has expired. Please login again.', function () { app.trigger('loginRequired'); });
            return true;
        }

        return false;
    },

    resultColour: function (score) {
        return (score == 0 ? 'red' : (score == 100 ? 'green' : 'yellow'));
    },

    resultText: function (score) {
        return (score == 0 ? 'Incorrect' : (score == 100 ? 'Correct' : 'Partially Correct'));
    },

    convertExamListToDropDownFormat: function (examList) {
        var options = _.map(examList, function (item) {
            return {
                id: item.ExamId,
                text: item.ExamName
            }
        });

        return options;
    },
	
	//## Indicates if the javascript (in this file) has been minified
	isMinified: function() {
		//## Upon minification this function's "not_minified" variable will be renamed with something shorter (e.g. 'a')
		var f = function() { var not_minified = ''; return not_minified; };
		
		try {
			return (f.toString().indexOf('not_minified') == -1);
		} catch(e) {
		}
		
		return false;
	}
};

//####################################################

var appLib = {
	isPhoneGap: function() {			
		try {
			return !_.isUndefined(device.cordova);				
		} catch(err) {
		}
		
		return false;
	},
							
	
	alert: function(message, alertCallback, title, buttonLabel) {							
		if(_.isUndefined(alertCallback))
			alertCallback = function() { };
		
		if(_.isUndefined(title))
			title = 'Information';
			
		if(_.isUndefined(buttonLabel))
			buttonLabel = 'OK';
		
	
		if(this.isPhoneGap())
			navigator.notification.alert(message, alertCallback, title, buttonLabel);
		else {					
			alert(message);
			alertCallback();
		}
	},
				
	
	confirm: function(message, confirmCallback, title, buttonLabels) {			
		if(_.isUndefined(confirmCallback))			
			confirmCallback = function() { };					//## Pointless use of confirm!
			
		if(_.isUndefined(title))
			title = '';
			
		if(_.isUndefined(buttonLabels))
			buttonLabels = 'Yes,No';
	
	
		if(this.isPhoneGap())
			navigator.notification.confirm(message, confirmCallback, title, buttonLabels);
		else {					
			var result = confirm(message);
			confirmCallback(result ? 1 : 2);
		}
	},
	
	
	//##TODO: Test on PhoneGap
	isOnline: function() {
		if(this.isPhoneGap())
			return navigator.network.connection.type != Connection.NONE;
		else
			return true;
	},
	
	
	maskUI: function(showMask) {		
		if(showMask)
			$('#block-ui').show();
		else
			$('#block-ui').hide();
	},
	
	isUIMasked: function() {
		return $('#block-ui').is(':visible');
	},


	//## Populates a ddlb with options (of type { id, text })
	fillDropDown: function(dropDownId, options, optionPrefix, optionSuffix) {
		$('#' + dropDownId).empty();

		_.each(options, function (item) {
			var attr = '';

			//## Is the option selected?
			if (!_.isUndefined(item.selected) && item.selected)
				attr = ' selected="selected" ';

			$('#' + dropDownId).append('<option value="' + item.id + '" ' + attr + '>' + optionPrefix + item.text + optionSuffix + '</option>');
		});
		
		$('#' + dropDownId).selectmenu('refresh');
	},



	//## Sorts and then populates a ddlb with options (of type { id, text })
	sortAndFillDropDown: function(dropDownId, options) {
		var sortedOptions = _.sortBy(options, function(item) {
			return item.text.toLowerCase();  
		});

		this.fillDropDown(dropDownId, sortedOptions, '', '');
	},
	
	
	//## Get unique device id [Format: GUID - DEVICE # OS VERSION   e.g. 33464622-c584-5daa-cd1c-d68efd103408-iphone#6.0]
	getDeviceId: function() {                
		//## Has an ID been generated and saved?
		var id = window.localStorage.getItem('oeguid');
		if(id == null) {
			//## No - create and save an ID with device and OS version
			id = (this.createGuid() + '-' + this.getDevice() + '#' + this.getDeviceVersion()).substring(0, 50);
			window.localStorage.setItem('oeguid', id);
			
			this.log('---> Generating new device id: ' + id);
		} else {                    					
			//## Does the device id contain OS version number?
			if(id.indexOf('#') < 0) {
				//## No - append OS version number and save
				id = (id + '#' + this.getDeviceVersion()).substring(0, 50);
				window.localStorage.setItem('oeguid', id);
				this.log('---> Updated device id to: ' + id);
			}
			
			this.log('---> Using existing device id: ' + id);
		}
			
		return id;
	},
	
	
	//## Get device the app is running on
	getDevice: function() {
		if(!this.isPhoneGap())
			return 'web';
		
		var d = device.platform.toLowerCase();                

		if(d.indexOf('ios') >= 0) {
			var model = device.model.toLowerCase();
		
			if(model.indexOf('iphone') >= 0) {
				d = 'iphone';
			} else if(model.indexOf('ipad') >= 0) {
				d = 'ipad';
			} else if(model.indexOf('ipod') >= 0) {
				d = 'ipod';
			}
		} else if(d.indexOf('android') >= 0) {
			d = 'android';
		} else {
			d = 'unknown';
		}
			
		return d;
	},
	
	
	getDeviceVersion: function() {
		if(!this.isPhoneGap())
			return '1.0';
			
		return device.version.toLowerCase();
	},
	
	
	//## Generate GUID
	createGuid: function() {
		var S4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	},
	
	
	//## Log debug info to console, variable or no where
	log: function(msg) {
		//console.log(msg);
	},
	
	
	//## Tracks events in google analytics
	track: function(event) {                
		try {
			analytics.trackPage(function() { appLib.log('ga track page success'); }, function() { appLib.log('ga track page fail'); }, '/' + event);
		} catch(e) {
			//alert(JSON.stringify(e, null, 4));
		}
	},
	
	//## Indicates if a value is an integer or can be safely converted to one
	isInt: function(value) {
		if ((undefined === value) || (null === value)) {
			return false;
		}
		return value % 1 == 0;
	},
	
	
	//## Saves data (to a file named 'data{key}.txt')
	saveData: function(key, data, onSuccess, onFailure) {
		//##TODO: Create HTML5 version
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
				appLib.log('got file system');
			
				fileSystem.root.getFile('data' + key + '.txt', {create: true, exclusive: false}, function(dataFile) {
						appLib.log('got file');
				
						dataFile.createWriter(function(writer) {
								writer.onwrite = function(evt) {
									appLib.log(evt);
									appLib.log('saveData successful ' + writer.length);
									onSuccess();
								};
								
								writer.write(data);
							},
							function(evt) {
								appLib.log('saveData error: ' + evt.target.error.code);
								onFailure();
							}
						);
					
					},
					onFailure
				);
			},
			onFailure
		);
	},
	
	
	//## Loads data (from a file named 'data{key}.txt')
	loadData: function(key, onSuccess, onFailure) {
		//##TODO: Create HTML5 version
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
				appLib.log('got file system');
				
				fileSystem.root.getFile('data' + key + '.txt', {create: true}, function(dataFile) {
						appLib.log('got file');
						
						dataFile.file(function(targetFile) {
								try {
									//## Force use of phonegap filereader as iOS6 implements a native filereader
									var FileReader = cordova.require('cordova/plugin/FileReader');
									var reader = new FileReader();
									
									reader.onloadend = function(evt) {
										appLib.log('loadData successful');
										appLib.log(evt.target.result);
										onSuccess(evt.target.result);
									};
									
									reader.readAsText(targetFile);
								} catch(ex) {
									appLib.log(ex);
								}
							},
							function(error) {
								appLib.log('loadData error: ' + error.code);
								onFailure();
							}
						);
					},
					onFailure
				);
			},
			onFailure
		);
	},
	
	
	//## Downloads url to specified filename (in the root folder)
	downloadFile: function(url, filename, onSuccess, onFailure) {
		appLib.log('Downloading ' + url);
	
		try {
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
				function(fileSystem) {
					appLib.log('Got FS');						
					
					fileSystem.root.getDirectory('files', 
						{ create:true }, 
						function(folder) {																				
							var fullPath = folder.fullPath + '/' + filename;																
							appLib.log('FS: ' + fullPath);
							
							var fileTransfer = new FileTransfer();
							fileTransfer.download(url, 
												  fullPath, 
												  function() { 
													appLib.log('Download ok');
													onSuccess(url, fullPath); 
												  },
												  onFailure);
						},
						onFailure);
				},
				onFailure);
		} catch(ex) {
			appLib.log('caught: ' + ex);
			onFailure();
		}
	}
};