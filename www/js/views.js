//## ----------------- VIEWS

//## Home
var HomeView = Backbone.View.extend({


    template: _.template($('#HomeTemplate').html()),

    render: function (eventName) {


		var hideContinueSession = _.isUndefined(this.model) || this.model == null;		
		var continueSessionButtonStyle = (hideContinueSession ? 'display:none;' : '');


		var loginStyle = (oe.auth.get('email') ? 'display:none;' : '');


		
		var html = this.template({ buttonStyle: loginStyle });
        $(this.el).html(html);		
                                    
        return this;
    }
});




//========================================================================================

//## Settings	
var SettingsView = Backbone.View.extend({
    template: _.template($('#SettingsTemplate').html()),

    render: function (eventName) {

        $(this.el).html(this.template({ email : oe.auth.get('email')}));
        return this;
    },
	
	
	events: {
	    "click #searchDoctor": "searchDoctor"
	},
	
	searchDoctor: function () {

	    app.trigger("SearchDoctorResult");
	}
});


//========================================================================================

//## Terms & Conditions	
var TermsConditionsView = Backbone.View.extend({
    template: _.template($('#TermsConditionsTemplate').html()),

    render: function(eventName) {		
        $(this.el).html(this.template());        
		
        return this;
    }
    
});



//========================================================================================

//## Privacy Policy	
var PrivacyPolicyView = Backbone.View.extend({
    template: _.template($('#PrivacyPolicyTemplate').html()),

    render: function(eventName) {		
        $(this.el).html(this.template());        
		
        return this;
    }
    
});



//========================================================================================

//## Login	
var LoginView = Backbone.View.extend({
    template: _.template($('#LoginTemplate').html()),

    render: function(eventName) {	
        var demoModeStyle = (oe.destination == null ? '' : 'display:none;');
                                     
        $(this.el).html(this.template({ demoModeStyle: demoModeStyle }));        
		
        return this;
    },
	
	
	events: {
		"click #login-button": "login"		
	},
	
	login: function() {
		var email = this.$('#email').val()
		var password = this.$('#password').val();		
		
		if(email.length == 0) {
			appLib.alert('Email cannot be blank!');
			return;
		}

		if(password.length == 0) {
			appLib.alert('Password cannot be blank!');
			return;
		}
		
		
		this.tryAuth(email, password);
	},	
	
	
	tryAuth: function(email, password) {
	    var view = this;
		oe.ajax('login', 
				{
				    name:email
				},
				function(data, textStatus) { 
                    /*
                    appLib.log('success func');
                    appLib.log(data.d.AssessmentAPIToken);
                    appLib.log(data.d.AssessmentAPIToken.Token);
                    appLib.log(data.d.AssessmentAPIToken.UserId);
                    */
                
				    
				    if (!_.isUndefined(data) && !_.isUndefined(data.valid)) {
				        
				        if (data.valid) {
				            
				            view.model.set('email', email);
				            
				            view.model.set('key', "");
				            
				            view.model.set('userId', "");
				            
				            var locumRole = data.locumRole

				            
                            var appEvent = 'SearchDoctor';
                            if (locumRole && locumRole.toLowerCase().indexOf('hos') >= 0) {

                                view.model.set('userType', UserTypes.Hospital);
				            } else {

                                view.model.set('userType', UserTypes.Doctor);
                                appEvent = 'SearchDoctorResult';
				            }

                            
                            app.trigger(appEvent);

						}
					}
				}, 
				function (xhr, msg, errorText) {
				    alert(msg);
                });

	}
});



//========================================================================================

//## RegisterView	
var RegisterView = Backbone.View.extend({
    template: _.template($('#RegisterTemplate').html()),

    render: function (eventName) {
        var demoModeStyle = (oe.destination == null ? '' : 'display:none;');

        $(this.el).html(this.template({ demoModeStyle: demoModeStyle }));

        return this;
    },


    events: {
        "click #login-button": "login"
    },

    login: function () {
        var email = this.$('#email').val()
        var password = this.$('#password').val();

        if (email.length == 0) {
            appLib.alert('Email cannot be blank!');
            return;
        }

        if (password.length == 0) {
            appLib.alert('Password cannot be blank!');
            return;
        }


        this.tryAuth(email, password);
    },


    tryAuth: function (email, password) {
        var view = this;

        oe.ajax('AuthenticateUser',
				{
				    deviceId: appLib.getDeviceId(),
				    emailAddress: email,
				    password: password
				},
				function (data, textStatus) {
				    /*
                    appLib.log('success func');
                    appLib.log(data.d.AssessmentAPIToken);
                    appLib.log(data.d.AssessmentAPIToken.Token);
                    appLib.log(data.d.AssessmentAPIToken.UserId);
                    */

				    if (!_.isUndefined(data.d) && !_.isUndefined(data.d.AssessmentAPIToken)) {
				        if (data.d.AssessmentAPIToken.Token != null) {
				            view.model.set('email', email);
				            view.model.set('key', data.d.AssessmentAPIToken.Token);
				            view.model.set('userId', data.d.AssessmentAPIToken.UserId);

				            //## Signal where to navigate to. Default to selecting exam, but can optionally be session review
				            var appEvent = 'selectExam';
				            if (oe.destination != null) {
				                appLib.log('destination is ' + oe.destination);
				                appEvent = oe.destination;
				                oe.destination = null;
				            }

				            app.trigger(appEvent);
				            alert(appEvent);
				        }
				    }
				},
				function (xhr, msg, errorText) {
				    
				});

    }
});



//========================================================================================

//## Getting Started	
var GettingStartedView = Backbone.View.extend({
    template: _.template($('#GettingStartedTemplate').html()),

    render: function(eventName) {		
        $(this.el).html(this.template());        
		
        return this;
    }
    
});


//========================================================================================

//## Demo page	
var DemoView = Backbone.View.extend({
    template: _.template($('#DemoTemplate').html()),

    render: function(eventName) {		
        $(this.el).html(this.template());        
		
        return this;
    },
	
	
	events: {
		"click #startQuestions": "startQuestions"
	},	
	
	startQuestions: function() {		
		app.trigger('startDemoQuestions');
	}		
});


//========================================================================================

//## Search Doctor 
var SearchDoctorView = Backbone.View.extend({
    template: _.template($('#SearchDoctorTemplate').html()),

    render: function (eventName) {
        //## Get the user's exams
        

        $(this.el).html(this.template({ selectExamButton: 'Select Revision Options' }));

        return this;
    },

    renderUserExams: function (exams, currentExamId) {

    },


    events: {
        "click #searchDoctor": "searchDoctor"
    },

    searchDoctor: function () {

        app.trigger('SearchDoctorResult');
    }
});


//========================================================================================

//## Search Doctor Review
var SearchDoctorResultView = Backbone.View.extend({
    template: _.template($('#SearchDoctorResultTemplate').html()),

    render: function (eventName) {
        //## Get the user's exams
        oe.getUserExams(this.renderUserExams);

        $(this.el).html(this.template({ selectExamButton: 'Select Revision Options' }));

        return this;
    },

    renderUserExams: function (exams, currentExamId) {
        var options = _.map(exams, function (item) {
            return {
                id: item.ExamId,
                text: item.ExamName,
                selected: (item.ExamId == currentExamId)
            }
        });

        appLib.fillDropDown('examList', options, '', '');
    },


    events: {
        "click #selectExam": "selectExam"
    },

    selectExam: function () {
        var selectedExamId = $('#examList').val();

        if (selectedExamId == null) {
            appLib.alert('Please select an exam');
            return;
        }


        oe.selectedExamId = selectedExamId;
        app.trigger('selectRevisionType');
    }
});


//========================================================================================

//## Demo Exam page
var DemoExamView = Backbone.View.extend({
    template: _.template($('#ExamSelectionTemplate').html()),

    render: function (eventName) {
        //## Get the demo exams
        oe.getDemoExams(this.renderDemoExams, this.renderLocalDemoExams);

        //## For testing without internet: 
        //_.delay(this.renderLocalDemoExams, 1000, this); 

        $(this.el).html(this.template({ selectExamButton: 'Start Demo Questions' }));

        return this;
    },


    //## Successfully downloaded demo exams, save and display them
    renderDemoExams: function (exams) {
        var options = oe.convertExamListToDropDownFormat(exams);        

        appLib.log('Displaying API demo exams');
        appLib.sortAndFillDropDown('examList', options);
    },


    //## Use local demo data if internet is unavailable
    renderLocalDemoExams: function () {
        if (oe.demoExams == null || oe.demoExams.length == 0) {
            appLib.alert('An Internet connection is required to download all demo exams');

            //## Setup local MRCP Part 1 exam and questions
            oe.demoExams = [{ ExamId: oeConstants.mrcpPart1, ExamName: 'MRCP Part 1'}];
            oe.demoQuestions = [{ examId: oeConstants.mrcpPart1, updatedAt: 0, questions: null}];

            appLib.log('Local exams = local MRCP Part 1');
                                        
        } else {					
			//## Limit demoExams to exams that we have questions for
			var availableExams = _.filter(oe.demoExams, function(availableExam) {
				//## Do we have questions for this exam?
				var haveQuestions = false;
				
				_.each(oe.demoQuestions, function(exam) {
					if(exam.examId == availableExam.ExamId)
						haveQuestions = true;
				});
				
				return haveQuestions;
			});
                                        
            //## Add MRCP Part 1 if it's not been downloaded
            var containsMrcpPart1 = false;
			_.each(availableExams, function(exam) {
				 if(exam.ExamId == oeConstants.mrcpPart1)                                               
					containsMrcpPart1 = true;                                  
			});

			if(!containsMrcpPart1) {
				availableExams.push({
										ExamId: oeConstants.mrcpPart1,
										ExamName: 'MRCP Part 1'
									});
			
			   oe.demoQuestions.push({ examId: oeConstants.mrcpPart1, updatedAt: 0, questions: null});
			}
                                        
										
			appLib.log('filtering demo question list');
			oe.demoExams = availableExams;
		}

		
        var options = oe.convertExamListToDropDownFormat(oe.demoExams);

        appLib.log('Displaying local demo exams');
        appLib.sortAndFillDropDown('examList', options);
    },


    events: {
        "click #selectExam": "selectExam"
    },

    selectExam: function () {
        var selectedExamId = $('#examList').val();

        if (selectedExamId == null) {
            appLib.alert('Please select an exam');
            return;
        }


        //## Do we have any local demo questions for this exam?
        var demoExam = _.find(oe.demoQuestions, function (exam) {
            return (exam.examId == selectedExamId);
        });



        //## Function to download demo questions, and if successful save them locally, before starting to view the questions
        var downloadDemoQuestions = function (examId) {
                                        oe.getDemoQuestions(examId,
                                                            function (questions, updateDate) {
                                                                //## Store demo questions locally
                                                                oe.demoQuestions.push({
                                                                    examId: examId,
                                                                    questions: questions,
                                                                    updatedAt: updateDate
                                                                });

                                                                appLib.log('Starting downloaded demo questions for exam ' + examId);
                                                                app.trigger('startDemoQuestions');
                                                            },
                                                            function () {
                                                                appLib.alert('An Internet connection is required to download demo questions');
                                                            });
        };


        //## Function to setup and view local demo questions
        var startLocalDemoQuestions = function (demoExam) {
            appLib.log('Starting local demo questions for exam ' + demoExam.examId);            

            //## Load questions, but don't download images as we're offline
            oe.loadQuestions(demoExam.questions, 
                             demoExam.examId, 
                             false, 
                             function () {
                                app.trigger('startDemoQuestions');
                             },
                             jQuery.noop);
        };



        if (demoExam == null) {
            //## No local questions - download from API
            downloadDemoQuestions(selectedExamId);

        } else {

            //## Has the user selected local MRCP Part 1 demo?
            if (selectedExamId == oeConstants.mrcpPart1 && demoExam.questions == null) {
                oe.questionBank = demoQuestions;
                oe.assessmentId = null;

                appLib.log('Starting hardcoded demo question for MRCP Part 1');

                app.trigger('startDemoQuestions');
                return;
            }


            //## Local questions, but are they up-to-date?
            oe.getDemoLastChangeDate(selectedExamId,
                                     function (updatedAt) {
                                         if (demoExam.updatedAt != updatedAt) {
                                             //## New questions so remove demo exam from local demo list
                                             oe.demoQuestions = _.without(oe.demoQuestions, demoExam);

                                             appLib.log('Updating demo questions for exam ' + selectedExamId);

                                             //## Download new demo questions - and save to local demo list
                                             downloadDemoQuestions(selectedExamId);

                                         } else {
                                             //## No updates, so use current demo questions
                                             startLocalDemoQuestions(demoExam);
                                         }
                                     },
                                     function () {
                                         //## Error checking for question updates - so use local demo questions
                                         startLocalDemoQuestions(demoExam);
                                     });
        }
    }
});


//========================================================================================

//## Revision Type Selection
var RevisionTypeMenuView = Backbone.View.extend({
    template: _.template($('#RevisionTypeTemplate').html()),

    render: function (eventName) {
        //## Download curricula and render the list
        oe.getCurricula(this.renderCategoryList, oe.selectedExamId);

        //## Download question types for this exam        
		//## Call oe.getQuestionTypes(this.renderQuestionTypeList, oe.selectedExamId) with the current context
        $.proxy(oe.getQuestionTypes, this, this.renderQuestionTypeList, oe.selectedExamId).apply();        

        $(this.el).html(this.template());
        return this;
    },


    events: {
        "click #startQuestions": "startQuestions",
        "change #revisionType": "changeRevisionType",
        "change #questionDifficulty": "showQuestionDifficulty",
        "change #questionCategory": "showQuestionCategories",
        "change #questionType": "showQuestionTypes",
        "change #questionStatus": "changeQuestionStatus",

        //## Seems backbone uses 'live()' to bind events, so this works even though the checkboxes don't exist when the view is rendered!
        "change #questionCategoryList input[type='checkbox']": "updateWorkSmartQuestionCount",
        "change #questionTypeList input[type='checkbox']": "updateQuestionCount",
		
		"click #selectAllCats": "selectAllCats",
        "click #selectNoCats": "selectNoCats"
    },

	
    selectAllCats: function() {
        $("#questionCategoryList input[type='checkbox']").each(function() {
            this.checked = true;
        }).checkboxradio('refresh');
        
        this.updateWorkSmartQuestionCount();
    },
    
	
    selectNoCats: function() {
        $("#questionCategoryList input[type='checkbox']").each(function() {
            this.checked = false;
        }).checkboxradio('refresh');
        
        this.updateWorkSmartQuestionCount();
    },

	
    startQuestions: function () {
        //## Download required questions
        var revisionType = $('#revisionType').val();
        var numberOfQuestions = $('#questionLimit').val();
        var difficulty = this.getDifficulty();
        var questionTypes = this.getQuestionTypes();

        if (numberOfQuestions == null || numberOfQuestions == '0') {
            appLib.alert('No questions match the selected filters');
            return;
        }

        if (oe.selectedExamId == null) {
            appLib.alert('There is no selected exam!');
            return;
        }

        if (questionTypes.length == 0) {
            appLib.alert('Select at least one question type!');
            return;
        }



        if (revisionType == 'PastPaper') {
            //##TODO: Add support for past papers

            //oe.questionBank = pastPaperQuestions;
            //app.trigger('startQuestions', false, true);
        }
        else if (revisionType == 'WorkSmart') {
            var categories = this.getCategories();

            //## Download work smart questions
            oe.workSmart(
				function () {
					appLib.track('work-smart-' + numberOfQuestions);
					app.trigger('startQuestions', true, false);
				},
				this.getQuestionStatus(),
				difficulty.minDiff,
				difficulty.maxDiff,
				categories,
				numberOfQuestions,
				oe.selectedExamId,
				questionTypes
			);
        }
        else if (revisionType == 'WorkHard') {
            //## Download work hard questions
            oe.workHard(
				function () {
					appLib.track('work-hard-' + numberOfQuestions);

					//## Start questions if download is successful
					app.trigger('startQuestions', true, false);
				},
				numberOfQuestions,
				questionTypes
			);
        }
    },


    renderCategoryList: function (categories) {
        $('#questionCategoryList').empty().append('<legend></legend>');

        var count = 1;
        _.each(categories, function (cat) {
            $('#questionCategoryList').append('<input type="checkbox" data-theme="e" id="cat' + count + '" value="' + cat.value + '" />'
											  + '<label for="cat' + count + '">' + cat.key + '</label>');
            count++;
        });

        $("#questionCategoryList input[type='checkbox']").checkboxradio();
    },


    renderQuestionTypeList: function (questionTypes) {
        $('#questionTypeList').empty().append('<legend>Types:</legend>');

        var count = 1;
        _.each(questionTypes, function (type) {
            $('#questionTypeList').append('<input type="checkbox" data-theme="e" id="type' + count + '" value="' + type.QuestionType + '" />'
											  + '<label for="type' + count + '">' + type.ExamSpecificName + '</label>');
            count++;
        });

        $("#questionTypeList input[type='checkbox']").checkboxradio();
		
		this.updateQuestionCount();
    },


    showQuestionCategories: function () {
        if ($('#questionCategory').val() == 'SelectCategories') {
            $('#questionCategorySection').show();
            //-- REFRESH CONTROL & PAGE TO CORRECTLY APPLY STYLING 
            $("#questionCategoryList").controlgroup("refresh");
            $('#RevisionTypeTemplate').trigger('create');
        }
        else
            $('#questionCategorySection').hide();
    },

    showQuestionTypes: function () {
        if ($('#questionType').val() == 'SelectQuestionTypes') {
            $('#questionTypeSection').show();
            //-- REFRESH CONTROL & PAGE TO CORRECTLY APPLY STYLING 
            $("#questionTypeList").controlgroup("refresh");
            $('#RevisionTypeTemplate').trigger('create');               // Is this needed?
        }
        else {
            $('#questionTypeSection').hide();
		}
			
		this.updateQuestionCount();
    },

    getCategories: function () {
        if ($('#questionCategory').val() != 'SelectCategories')
            return null;

        var selected = $("#questionCategoryList input:checked");

        var categories = [];
        _.each(selected, function (item) {
            var ids = $(item).val();

            _.each(ids.split(','), function (id) {
                categories.push({ CurriculumID: id });
            });
        });

        return categories;
    },

    getQuestionTypes: function () {
        var selected;

        if ($('#questionType').val() != 'SelectQuestionTypes') {
            //## API v1.1 supported sending empty array to request all question types for work hard.
            //## API v1.1.1 requires question types to be specified for work hard.
            selected = $("#questionTypeList input");
        } else {
            selected = $("#questionTypeList input:checked");
			
			//## If no types are selected then return all valid question types
			if(selected.length == 0)
				selected = $("#questionTypeList input");
        }

        var types = _.map(selected, function (item) {
            return $(item).val();
        });

        return types;
    },


    changeRevisionType: function (e) {
        var revisionType = $('#revisionType').val();

        if (revisionType == 'PastPaper') {
            $('#workSmartGroup').hide();
            $('#pastPaperGroup').show();
        }
        else if (revisionType == 'WorkSmart') {
            $('#pastPaperGroup').hide();
			$('#workHardStatus').hide();
            $('#workSmartGroup').show();			

            this.updateWorkSmartQuestionCount();
        }
        else if (revisionType == 'WorkHard') {
            $('#pastPaperGroup').hide();
            $('#workSmartGroup').hide();
			$('#workHardStatus').show();

            var options = [
                { id: 10, text: '10' },
                { id: 20, text: '20' },
                { id: 30, text: '30' },
                { id: 40, text: '40' },
                { id: 50, text: '50' },
                { id: 60, text: '60' },
                { id: 70, text: '70' },
                { id: 80, text: '80' },
                { id: 90, text: '90' },
                { id: 100, text: '100' }
            ];
            appLib.fillDropDown('questionLimit', options, '', ' questions');
        }
    },




    changeQuestionStatus: function () {
        this.updateWorkSmartQuestionCount();
    },


    updateQuestionCount: function () {
        var revisionType = $('#revisionType').val();

        if (revisionType == 'WorkSmart') {
            this.updateWorkSmartQuestionCount();
        } else if (revisionType == 'WorkHard') {
            this.updateWorkHardQuestionCount();			
        }
    },


    updateWorkSmartQuestionCount: function () {
        var diff = this.getDifficulty();
        var categories = this.getCategories();
        var questionTypes = this.getQuestionTypes();

        if (oe.selectedExamId == null) {
            appLib.alert('There is no selected exam!');
            return;
        }

        //## Populate ddlb with options from 10 to 100 or less if there are fewer questions
        oe.workSmartQuestionCount(
			function (questionCount) {
				var options = [];
				var limit = Math.min(questionCount, 100);

				for (var i = 10; i <= limit; i += 10)
					options.push({ id: i, text: i });

				//## Add the total number of questions if less than 100, but not divisible by 10 (as it'll be a duplicate)
				if (limit < 100 && limit % 10 > 0)
					options.push({ id: questionCount, text: questionCount });

				//## If there are no questions then add a zero questions option
				if (options.length == 0)
					options.push({ id: 0, text: 0 });

				appLib.fillDropDown('questionLimit', options, '', ' questions');
			},
			this.getQuestionStatus(),
			diff.minDiff,
			diff.maxDiff,
			categories,
			oe.selectedExamId,
			questionTypes
		);
    },
	
	
	updateWorkHardQuestionCount: function() {
		$.proxy(
			oe.getWorkHardStatus, 
			this, 
			function(questionsAnswered, totalQuestions) {
				var pct = Math.floor((questionsAnswered / totalQuestions) * 100, 0) + '%';
			
				$('#workHardStatus .progress-bar-inner')
					.css('width', pct)
					//.text(questionsAnswered + ' of ' + totalQuestions + ' answered (' + pct + ' complete)')
					.parent().show();

                $('#workHardStatus .progress-text')
                    
                    .text(questionsAnswered + ' of ' + totalQuestions + ' answered (' + pct + ' complete)');
                    
			},
			this.getQuestionTypes()
		).apply();		
	},


    isDifficultySliderVisible: function () {
        return $('#questionDifficulty').val() == 'SelectDifficulty';
    },

    showQuestionDifficulty: function (e) {
        var questionDifficulty = $('#questionDifficulty').val();

        if (questionDifficulty == 'AllQuestions')
            $('#difficultySliderGroup').hide();
        else if (questionDifficulty == 'SelectDifficulty')
            $('#difficultySliderGroup').show();
    },

    getDifficulty: function () {
        var minDiff = 0.01, maxDiff = 0.99;

        if (this.isDifficultySliderVisible()) {
            var diffVal = parseInt($('#questionDifficultyValue').val());

            minDiff = (diffVal - 1) / 10;
            maxDiff = (diffVal + 1) / 10;

            if (minDiff <= 0)
                minDiff = 0.01;

            if (maxDiff >= 1)
                maxDiff = 0.99;
        }

        return {
            minDiff: minDiff,
            maxDiff: maxDiff
        };
    },

    getQuestionStatus: function () {
        var status = $('#questionStatus').val();

        if (status == 'NotSeen')
            return oe.workSmartQuestionType.NotSeenBefore;
        else if (status == 'AllQuestions')
            return oe.workSmartQuestionType.AllQuestions;
        else if (status == 'WrongQuestions')
            return oe.workSmartQuestionType.WrongBefore;
        else if (status == 'TaggedQuestions')
            return oe.workSmartQuestionType.Tagged;
    }

});



//========================================================================================

//## BoF View
var QuestionBrowserView = Backbone.View.extend({
    template: _.template($('#QuestionBrowserTemplate').html()),
    optionTemplate: _.template($('#QuestionOptionTemplate').html()),

    render: function (eventName) {
        var optionHtml = this.buildHtmlForOptions(this.model.get('options'));

        //## Used for question index and count
        var session = oe.currentSession();

        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    selectText: '(Please select 1 option)',
										reviewButtonStyle: (session.get('answers').length > 0 ? '' : 'display:none;')
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
				
        //## Delay until view is rendered then update radio state after each radio state change
        _.delay(function() {
            $(document).on('change', 'input[type=radio]', function(e) {				
                $('input[type=radio]').checkboxradio('refresh');				
            });
        }, 1000, this);				
		
        return this;
    },


    //## Returns HTML for a radio list of options
    buildHtmlForOptions: function (options) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        var template = this.optionTemplate;
        var optionHtml = '';

        //## Process question options
        options.each(function (option) {
            optionHtml += template(option.toJSON());
        });

        return optionHtml;
    },



    events: {
        "click #answer-button": "answerQuestion",
        "click #session-review-button": "sessionReview"
    },

    answerQuestion: function () {
        var selection = $('#optionList').find('input[type=radio]:checked');

        //## Ensure an answer has been selected
        if (selection.length != 1) {
            appLib.alert('Please select one option.');
            return;
        }

        //## Store the user's answer
        var answerId = parseInt(selection.val());
        this.model.answerQuestion(answerId);
    },

    sessionReview: function () {
        appLib.confirm('Are you sure you want to finish this question session?',
					   function (index) {
					       if (index == 1)
					           app.trigger("viewSessionResults");
					   },
					   'Finish Questions?',
					   'Yes,No');
    }
});




//## BoF Answer
var QuestionBrowserAnswerView = Backbone.View.extend({
    template: _.template($('#QuestionBrowserAnsweredTemplate').html()),
    disabledOptionTemplate: _.template($('#DisabledQuestionOptionTemplate').html()),

    render: function (eventName) {
        var answer = this.model.get('lastAnswer');
        var optionHtml = this.buildHtmlForOptions(this.model.get('options'), answer.get('answerId'));

        //appLib.log('Comment: ' + this.model.get('comment'));

        //## Used for question index and count
        var session = oe.currentSession();


        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    resultColour: oe.resultColour(answer.get('score')),
									    result: oe.resultText(answer.get('score')),
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    nextButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next Question'),
										nextNavButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next'),
                                        selectText: ''
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    //## Returns HTML for a radio list of options
    buildHtmlForOptions: function (options, userAnswerId) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        //## Copy options so as not to modify the original when displaying correct/incorrect labels
        var localOptions = new Backbone.Collection(options.toJSON());

        var template = this.disabledOptionTemplate;
        var optionHtml = '';

        //## Process question options
        localOptions.each(function (option) {
            var selected = '';
            var text = option.get('text');

            //## Check the user's selected answer
            if (option.get('id') == userAnswerId) {
                selected = 'checked';

                if (option.get('score') == 100)
                    option.set('text', text + ' - <span class="correct">Correct</span>');
                else
                    option.set('text', text + ' - <span class="incorrect">Incorrect answer selected</span>');
            }
            else if (option.get('score') == 100)
                option.set('text', text + ' - <span class="correct">This is the correct answer</span>');


            var modelData = option.toJSON();
            optionHtml += template(_.extend(modelData, { checked: selected }));
        });

        return optionHtml;
    }
});



//========================================================================================

//## NoM View
var NOMView = Backbone.View.extend({
    template: _.template($('#QuestionBrowserTemplate').html()),
    optionTemplate: _.template($('#OptionCheckboxTemplate').html()),

    render: function (eventName) {
        var optionHtml = this.buildHtmlForOptions(this.model.get('options'));

        //## Used for question index and count
        var session = oe.currentSession();

        var correctOptions = this.model.get('numberOfOptions');
        var selectText = '(Please select ' + correctOptions + ' option' + (correctOptions > 1 ? 's' : '') + ')';
        if (this.model.get('selectAllThatApply'))
            selectText = '(Please select all that apply)';


        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    selectText: selectText,
										reviewButtonStyle: (session.get('answers').length > 0 ? '' : 'display:none;')
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));

		
        //## Delay until view is rendered then update checkbox state after each checkbox state change
        _.delay(function() {
            $(document).on('change', 'input[type=checkbox]', function(e) {
                $('input[type=checkbox]').checkboxradio('refresh');
            });
        }, 1000, this);
                                   
								   
        return this;
    },


    //## Returns HTML for a radio list of options
    buildHtmlForOptions: function (options) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        var template = this.optionTemplate;
        var optionHtml = '';

        //## Process question options
        options.each(function (option) {
            optionHtml += template(option.toJSON());
        });

        return optionHtml;
    },



    events: {
        "click #answer-button": "answerQuestion",
        "click #session-review-button": "sessionReview"
    },

    answerQuestion: function () {
        var selections = $('#optionList').find('input[type=checkbox]:checked');

        var requiredSelections = this.model.get('numberOfOptions');

        if (this.model.get('selectAllThatApply')) {
            //## Select all that apply
            if (selections.length == 0) {
                appLib.alert('Please select at least one option.');
                return;
            }

        } else {
            //## Select N options
            if (selections.length != requiredSelections) {
                appLib.alert('Please select ' + requiredSelections + ' options.');
                return;
            }
        }


        //## Store the user's answers
        var answers = [];

        _.each(selections, function (el) {
            answers.push(parseInt($(el).val()));
        });

        this.model.answerQuestion(answers);
    },

    sessionReview: function () {
        appLib.confirm('Are you sure you want to finish this question session?',
					   function (index) {
					       if (index == 1)
					           app.trigger("viewSessionResults");
					   },
					   'Finish Questions?',
					   'Yes,No');
    }
});




//## NoM Answer
var NOMAnsweredView = Backbone.View.extend({
    template: _.template($('#QuestionBrowserAnsweredTemplate').html()),
    disabledOptionTemplate: _.template($('#DisabledOptionCheckboxTemplate').html()),

    render: function (eventName) {
        var answer = this.model.get('lastAnswer');
        var optionHtml = this.buildHtmlForOptions(this.model.get('options'), answer.get('answers'));

        //appLib.log('Comment: ' + this.model.get('comment'));

        //## Used for question index and count
        var session = oe.currentSession();

        var correctOptions = this.model.get('numberOfOptions');
        var selectText = '';
        if (correctOptions == 1)
            selectText = '(There was 1 correct answer)';
        else
            selectText = '(There were ' + correctOptions + ' correct answers)';


        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    resultColour: oe.resultColour(answer.get('score')),
									    result: oe.resultText(answer.get('score')),
                                        questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    nextButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next Question'),
										nextNavButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next'),
									    selectText: selectText
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    //## Returns HTML for a radio list of options
    buildHtmlForOptions: function (options, userAnswers) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        //## Copy options so as not to modify the original when displaying correct/incorrect labels
        var localOptions = new Backbone.Collection(options.toJSON());

        var template = this.disabledOptionTemplate;
        var optionHtml = '';

        //## Process question options
        localOptions.each(function (option) {
            var selected = '';
            var text = option.get('text');

            //## Did the user select this answer?
            var selectedAnswer = _.find(userAnswers, function (answer) {
                return (answer == option.get('id'));
            });

            if (selectedAnswer != null) {
                selected = 'checked';

                if (option.get('score') == 100)
                    option.set('text', text + ' - <span class="correct">Correct</span>');
                else
                    option.set('text', text + ' - <span class="incorrect">Incorrect answer selected</span>');
            }
            else if (option.get('score') == 100)
                option.set('text', text + ' - <span class="correct">This is the correct answer</span>');


            var modelData = option.toJSON();
            optionHtml += template(_.extend(modelData, { checked: selected }));
        });

        return optionHtml;
    }
});



//========================================================================================

//## MCQ View
var MCQView = Backbone.View.extend({
    template: _.template($('#MCQTemplate').html()),
    optionTemplate: _.template($('#MCQOptionTemplate').html()),

    render: function (eventName) {
        var optionHtml = this.buildHtmlForOptions(this.model.get('options'));

        //## Used for question index and count
        var session = oe.currentSession();

        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
										reviewButtonStyle: (session.get('answers').length > 0 ? '' : 'display:none;')
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
		
		//## Delay until view is rendered then update checkbox state after each checkbox state change
        _.delay(function() {
            $(document).on('change', 'input[type=radio]', function(e) {
                $('input[type=radio]').checkboxradio('refresh');
				appLib.log("Refresher");
            });
        }, 1000, this);
		
        return this;
    },


    //## Returns HTML for multiple true/false radio options
    buildHtmlForOptions: function (options) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        var template = this.optionTemplate;
        var optionHtml = '';

        //## Process question options
        options.each(function (option) {
            optionHtml += template(option.toJSON());
        });

        return optionHtml;
    },



    events: {
        "click #answer-button": "answerQuestion",
        "click #session-review-button": "sessionReview"
    },

    answerQuestion: function () {
        //## Ensure all questions have been answered
        if ($('input[type=radio]:checked').length != ($('input[type=radio]').length / 2)) {
            appLib.alert('Please answer all sections.');
            return;
        }

        //## Create an array of answer IDs and values
        var answers = [];
        _.each($('input[type=radio]:checked'), function (radioEl) {
            var el = $(radioEl);

            answers.push({
                //## radioEl's name is the answerId prefixed with 'question-option-'
                id: el.attr('name').replace('question-option-', ''),
                value: (el.val() == "1")
            });
        });

        //## Store the user's answer		
        this.model.answerQuestion(answers);
    },

    sessionReview: function () {
        appLib.confirm('Are you sure you want to finish this question session?',
					   function (index) {
					       if (index == 1)
					           app.trigger("viewSessionResults");
					   },
					   'Finish Questions?',
					   'Yes,No');
    }
});


//## MCQ Answer
var MCQAnsweredView = Backbone.View.extend({
    template: _.template($('#MCQAnsweredTemplate').html()),
    disabledOptionTemplate: _.template($('#DisabledMCQOptionTemplate').html()),

    render: function (eventName) {
        var answer = this.model.get('lastAnswer');
        var optionHtml = this.buildHtmlForOptions(this.model.get('options'), answer.get('answers'));

        //## Used for question index and count
        var session = oe.currentSession();        


        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    resultColour: oe.resultColour(answer.get('score')),
									    result: oe.resultText(answer.get('score')),
                                        questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    nextButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next Question'),
										nextNavButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next'),
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    //## Returns HTML for a radio list of options
    buildHtmlForOptions: function (options, userAnswers) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        //## Copy options so as not to modify the original when displaying correct/incorrect labels
        var localOptions = new Backbone.Collection(options.toJSON());

        var template = this.disabledOptionTemplate;
        var optionHtml = '';

        //## Process question options
        localOptions.each(function (option) {
            var trueSelected = '';
            var falseSelected = '';
            var text = option.get('answerText');

            //## Get the user's response
            var currentAnswer = _.find(userAnswers, function (answer) {
                return (option.get('id') == answer.id);                
            });

            if (currentAnswer == null) {
                appLib.alert('Error - Could not find option id: ' + option.get('id'));
                return '';
            }


            //## Select the user's response radio button
            if (currentAnswer.value)
                trueSelected = 'checked';
            else
                falseSelected = 'checked';


            //## Display the result
            if (option.get('answer') == currentAnswer.value)
                option.set('answerText', text + ' - <span class="correct">Correct</span>');
            else
                option.set('answerText', text + ' - <span class="incorrect">Incorrect</span>');



            var modelData = option.toJSON();
            optionHtml += template(_.extend(modelData, { falseSelected: falseSelected, trueSelected: trueSelected }));
        });

        return optionHtml;
    }
});


//========================================================================================

//## EMQ View
var EMQView = Backbone.View.extend({
    template: _.template($('#EMQTemplate').html()),
    alphabeticTemplate: _.template($('#AlphabeticChoiceTemplate').html()),
    stemTemplate: _.template($('#EMQQuestionStemTemplate').html()),

    render: function (eventName) {
        var choiceList = this.buildAlphabeticChoiceList(this.model.get('choices'));
        var choiceDropDownHtml = this.buildHtmlForChoices(this.model.get('choices'));

        var stemHtml = this.buildHtmlForStems(this.model.get('options'), choiceDropDownHtml);

        //## Used for question index and count
        var session = oe.currentSession();

        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    stemHtml: stemHtml,
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    choiceList: choiceList,
										reviewButtonStyle: (session.get('answers').length > 0 ? '' : 'display:none;')
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    //## Returns HTML for a list of options prefixed by alphabetic chars
    buildAlphabeticChoiceList: function (choices) {
        if (_.isUndefined(choices) || choices.length == 0)
            return '';
        
        var choicesHtml = '';
        var index = 0;

        var template = this.alphabeticTemplate;

        //## Process choices
        choices.each(function (choice) {		
            choicesHtml += template(_.extend(choice.toJSON(), { letter: oeConstants.alpha[index] }));
            index++;
        });

        return choicesHtml;
    },


    //## Returns HTML for drop down list of choices
    buildHtmlForChoices: function (choices) {
        if (_.isUndefined(choices) || choices.length == 0)
            return '';

        var choicesHtml = '';

        //## Process choices
        choices.each(function (choice) {
            choicesHtml += '<option value="' + choice.get('id') + '" id="' + choice.get('id') + '">' + choice.get('text') + '</option>';
        });

        return choicesHtml;
    },


    //## Returns HTML for all question stems
    buildHtmlForStems: function (stems, choiceHtml) {
        if (_.isUndefined(stems) || stems.length == 0)
            return '';


        var template = this.stemTemplate;
        var stemHtml = '';

        //## Process stems
        stems.each(function (stem) {
			var isAdditionalAnswer = (stem.get('text') == oeConstants.emqAdditionalAnswer);
			var style = (isAdditionalAnswer ? 'display:none;' : '');		
			
            stemHtml += template(_.extend(stem.toJSON(), { 
				choiceHtml: choiceHtml, 
				style: style,
				isAdditionalAnswer: (isAdditionalAnswer ? '1' : '0') 
			}));			
			
			//## Padding between the pair of answers
			if(isAdditionalAnswer)
				stemHtml += "<div style='padding-bottom:20px;'></div>";
        });

        return stemHtml;
    },



    events: {
        "click #answer-button": "answerQuestion",
        "click #session-review-button": "sessionReview"
    },

    answerQuestion: function () {
        //## Ensure all questions have been answered
		var error = '';
        var answers = [];		
		var lastValue = null;
		
        $('select').each(function (index, element) {
            var el = $(element);

            if (el.val() == -1) {
                error = 'Please answer section ' + (index + 1);
                return false;
            } else if(el.data('additional-answer') == '1' && el.val() == lastValue) {
				error = 'Section ' + index + ' and ' + (index + 1) + ' cannot have the same answer';
                return false;
			}			

			//## Track last answer value for comparison in EMI questions
			lastValue = el.val();
			
            answers.push({ 
                //## select id is prefixed with 'stem-'
                itemId: parseInt(el.attr('id').replace('stem-', ''), 10),
                answerOptionId: parseInt(el.val(), 10)
            });
        });

        if (error.length > 0) {
            appLib.alert(error);
            return;
        }


        //## Store the user's answer		
        this.model.answerQuestion(answers);
    },


    //## Could be moved into a base class
    sessionReview: function () {
        appLib.confirm('Are you sure you want to finish this question session?',
					   function (index) {
					       if (index == 1)
					           app.trigger("viewSessionResults");
					   },
					   'Finish Questions?',
					   'Yes,No');
    }
});


//## EMQ Answer
var EMQAnsweredView = Backbone.View.extend({
    template: _.template($('#EMQAnsweredTemplate').html()),
    alphabeticTemplate: _.template($('#AlphabeticChoiceTemplate').html()),
    stemTemplate: _.template($('#EMQAnsweredQuestionStemTemplate').html()),

    render: function (eventName) {
        var answer = this.model.get('lastAnswer');
        var choiceList = this.buildAlphabeticChoiceList(this.model.get('choices'));
        var stemHtml = this.buildHtmlForStems(this.model.get('options'), this.model.get('choices'), answer.get('answers'));

        //## Used for question index and count
        var session = oe.currentSession();
        


        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    stemHtml: stemHtml,
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
                                        nextButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next Question'),
										nextNavButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next'),
									    choiceList: choiceList,
									    resultColour: oe.resultColour(answer.get('score')),
									    result: oe.resultText(answer.get('score'))
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    //## Returns HTML for a list of options prefixed by alphabetic chars
    buildAlphabeticChoiceList: function (choices) {
        if (_.isUndefined(choices) || choices.length == 0)
            return '';
        
        var choicesHtml = '';
        var index = 0;

        var template = this.alphabeticTemplate;

        //## Process choices
        choices.each(function (choice) {
            choicesHtml += template(_.extend(choice.toJSON(), { letter: oeConstants.alpha[index] }));
            index++;
        });

        return choicesHtml;
    },


    //## Returns HTML for drop down list of choices
    buildHtmlForChoice: function (choice) {
        return '<option value="' + choice.get('id') + '" id="' + choice.get('id') + '">' + choice.get('text') + '</option>';
    },


    //## Returns HTML for all question stems
    buildHtmlForStems: function (stems, choices, answers) {
        if (_.isUndefined(stems) || stems.length == 0
            || _.isUndefined(choices) || choices.length == 0
            || _.isUndefined(answers) || answers.length == 0)
            return '';


        var template = this.stemTemplate;
        var buildHtmlForChoice = this.buildHtmlForChoice;
        var stemHtml = '';


        //## Process stems
        stems.each(function (stem) {
            //## Get the answer for this stem
            var userAnswer = _.find(answers, function (answer) {
                return (answer.itemId == stem.get('id'));
            });

            if(userAnswer == null)
                return;


            //## Get the choice for this answerId
            //## [Different syntax as it's a Backbone collection]
            var choice = choices.find(function (choice) {
                return (choice.get('id') == userAnswer.answerOptionId);
            });
			
			var correctChoice = choices.find(function(choice) {
				return (choice.get('id') == stem.get('answerId'));
			});

            if(choice == null)
                return;

            var result;
			var correctAnswerText; 
            if (userAnswer != null && userAnswer.answerOptionId == stem.get('answerId')) {
                result = '<div class="emqAnswerCorrect marginTop"><h4 class="green emqAnswer"><span class="emqHeadingBG">Correct</span></h4>';
				correctAnswerText = '<p class="emqStemCorrect"></p>';
			}			
			else {
                result = '<div class="emqAnswerWrong marginTop"><h4 class="red emqAnswer"><span class="emqHeadingBG">Incorrect</span></h4>';
				correctAnswerText = '<p class="emqStemWrong">The correct answer is: ' + correctChoice.get('text') + '</p>';
			}
			
			var style = (stem.get('text') == oeConstants.emqAdditionalAnswer ? 'visibility:hidden; height:0px;' : '');
			
            stemHtml += template(_.extend(stem.toJSON(), { 
                choiceHtml: buildHtmlForChoice(choice),
                result: result,
				correctAnswerText: correctAnswerText,
				style: style
            }));
			
			//## Padding between the pair of answers
			if(style != '')
				stemHtml += "<div style='padding-bottom:50px;'></div>";
        });

        return stemHtml;    
    }

});





//========================================================================================

//## SJQ View
var SJQView = Backbone.View.extend({
    template: _.template($('#SJQTemplate').html()),
    optionTemplate: _.template($('#SJQOptionTemplate').html()),

    render: function (eventName) {
        var options = this.model.get('options');
        var optionHtml = this.buildHtmlForOptions(options);

        //## Used for question index and count
        var session = oe.currentSession();

        var selectionInfo = '(Please rank the options from 1 to ' + options.length + ' where 1 is the best and ' + options.length + ' is the worst)';

        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    optionHtml: optionHtml,
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
                                        selectionInfo: selectionInfo,
										reviewButtonStyle: (session.get('answers').length > 0 ? '' : 'display:none;')
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    //## Returns HTML for options with a textbox for rank
    buildHtmlForOptions: function (options) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        var template = this.optionTemplate;
        var optionHtml = '';

        //## Process question options
        options.each(function (option) {
            optionHtml += template(option.toJSON());
        });

        return optionHtml;
    },



    events: {
        "click #answer-button": "answerQuestion",
        "click #session-review-button": "sessionReview"
    },

    answerQuestion: function () {
        //## Ensure all options have been answered
        var answers = [];
        var ranks = [];
        var maxRank = this.model.get('options').length;

        $('input[type=number]').each(function (index, txt) {
            var el = $(txt);
            var val = el.val();
            var errorPrefix = 'Option ' + (index + 1);

            if (val.length < 1) {
                appLib.alert(errorPrefix + ' cannot be empty');
                return false;
            } else if (!appLib.isInt(val)) {
                appLib.alert(errorPrefix + ' is not an integer');
                return false;
            }

            var rank = parseInt(val, 10);
            if (rank < 1 || rank > maxRank) {
                appLib.alert(rank + ' is out of the range of 1 to ' + maxRank);
                return false;
            } else if (_.indexOf(ranks, rank) > -1) {
                appLib.alert('You have entered ' + rank + ' more than once. Please only use each number once');
                return false;
            }

            //## Store the rank and the answer
            ranks.push(rank);
            answers.push({
                //## textbox's id is the answerId prefixed with 'question-option-'
                id: parseInt(el.attr('id').replace('question-option-', ''), 10),
                rank: rank
            });
        });

        if (ranks.length != maxRank)
            return;


        //## Store the user's answer		
        this.model.answerQuestion(answers);
    },

    sessionReview: function () {
        appLib.confirm('Are you sure you want to finish this question session?',
					   function (index) {
					       if (index == 1)
					           app.trigger("viewSessionResults");
					   },
					   'Finish Questions?',
					   'Yes,No');
    }
});




//## SJQ Answer
var SJQAnsweredView = Backbone.View.extend({
    template: _.template($('#SJQAnsweredTemplate').html()),
    disabledOptionTemplate: _.template($('#AnsweredSJQOptionTemplate').html()),

    render: function (eventName) {
        var answer = this.model.get('lastAnswer');
        var userChoicesHtml = this.buildHtmlForUserAnswers(this.model.get('options'), answer.get('answers'));
        var correctChoicesHtml = this.buildHtmlForCorrectAnswers(this.model.get('options'));

        //## Used for question index and count
        var session = oe.currentSession();


        //## _.extend() copies right object properties into left object 
        var completeModel = _.extend(this.model.toJSON(),
									{
									    userChoicesHtml: userChoicesHtml,
									    correctChoicesHtml: correctChoicesHtml,
									    resultColour: oe.resultColour(answer.get('score')),
									    result: oe.resultText(answer.get('score')),
									    questionIndex: session.get('questionIndex') + 1,
									    questionCount: session.get('numQuestions'),
									    nextButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next Question'),
										nextNavButtonText: (session.allQuestionsAnswered() ? 'Finish' : 'Next')
									});


        //## Render the templated HTML
        $(this.el).html(this.template(completeModel));
        return this;
    },


    buildHtmlForUserAnswers: function (options, userAnswers) {
        var template = this.disabledOptionTemplate;
        var optionHtml = '';

        //## Sort user answers by rank
        var rankedAnswers = _.sortBy(userAnswers, function (answer) {
            return answer.rank;
        });


        //## Process each answer
        _.each(rankedAnswers, function (answer) {
            //## Find the text for this answer
            var option = options.find(function (option) {
                return (answer.id == option.get('id'));
            });

            var modelData = option.toJSON();
            optionHtml += template(_.extend(modelData, {}));
        });

        return optionHtml;
    },


    //## Returns HTML for a list of correct answers
    buildHtmlForCorrectAnswers: function (options) {
        if (_.isUndefined(options) || options.length == 0)
            return '';


        //## Copy options so as not to modify the original when displaying correct/incorrect labels
        var localOptions = new Backbone.Collection(options.toJSON());

        var template = this.disabledOptionTemplate;
        var optionHtml = '';

        //## Sort question options by rank
        var rankedOptions = localOptions.sortBy(function (option) {
            return option.get('rank');
        });


        _.each(rankedOptions, function (option) {
            var modelData = option.toJSON();
            optionHtml += template(_.extend(modelData, {}));
        });

        return optionHtml;
    }
});


//========================================================================================


//## Session Review
var SessionReviewView = Backbone.View.extend({
    template: _.template($('#SessionReviewTemplate').html()),

    render: function (eventName) {
        var answered = this.model.questionsAnswered();        
        var pct = Math.round(this.model.score());

        if (answered == 0)
            pct = '?';

        //## Render the templated HTML
        $(this.el).html(this.template({
            questionsAnswered: answered,
            questionsCorrect: this.model.correctAnswers(),
            percentCorrect: pct
        }));

        _.delay(this.uploadAnswersForView, 1000, this)

        return this;
    },

    events: {
        "click #uploadAnswersButton": "uploadAnswers"
    },

    uploadAnswers: function () {
        this.uploadAnswersForView(this);
    },

    //## This function does not rely on the [this] var as it's not called within the context of the SessionReviewView. 
    //## Instead a 'view' parameter is passed in and used in place of [this]
    uploadAnswersForView: function (view) {
        var correct = view.model.correctAnswers();
        var incorrect = view.model.wrongAnswers();
        var partial = view.model.questionsAnswered() - (correct + incorrect);

        //## Draw graph
        var pieData = [
            { label: "Correct", color: "rgba(105,190,40,1)", data: correct },
            { label: "Incorrect", color: "rgba(205,32,44,1)", data: incorrect },
            { label: "Partially Correct", color: "rgba(240,171,0,1)", data: partial }
        ];

        var pieOptions = {
            series: {
                pie: {
                    innerRadius: 0,
                    show: true
                }
            }
        };

        $.plot($("#livePie"), pieData, pieOptions);




        var answersToUpload = oe.getAnswersToUpload();

        //## Only upload answers if we have some that haven't been uploaded!
        if (answersToUpload == null || !oe.auth.uploadAnswers()) {
            view.showHomeButton();
            return;
        }

        $('#reviewStatus').html('Uploading answers...');

		
		//## POST cache problem with iOS6
		var currentTime = new Date();
		var cacheBuster = currentTime.getTime();
		
        //## Hardcoded ajax as don't want masking
        var options = {
            url: answersToUpload.url() + '?cacheBuster=' + cacheBuster,
            data: JSON.stringify(answersToUpload),
            context: view,
            success: view.uploadSuccessful,
            error: view.uploadError
        };

        options = oe.addAjaxOptions(options);

        appLib.log('calling: ' + options.type);
        appLib.log('data: ' + JSON.stringify(answersToUpload));
        jQuery.ajax(options);
    },

    //## Fires if answers are successfully uploaded
    uploadSuccessful: function (data) {
        appLib.log('Upload successful');
        appLib.log(data);

        if (!_.isUndefined(data.d.ErrorMessage) && data.d.ErrorMessage != null && data.d.ErrorMessage.length > 0) {
            appLib.log('API returned warning message');
            this.uploadError(null, '', data.d.ErrorMessage);
            return;
        }

        oe.markAnswersAsUploaded();
        oe.save();

        this.showHomeButton();
    },

    //## Fires if an error occurs during answer upload
    uploadError: function (xhr, msg, err) {
        appLib.log(err);
        appLib.log(xhr);

        if (err.indexOf('Invalid token') >= 0) {
            appLib.alert('Your session has expired. Please login again.', function () { app.trigger('loginRequired', 'viewSessionResults'); });
            appLib.track('upload-answers-session-expired');
            return;
        }


        //$('#reviewStatus').html('Unable to upload answers, please try again.');
        $('#uploadAnswersButton').show();

        
        //## Report error to GA
        var errorTrack = 'upload-answers-error';
        if(xhr != null && !_.isUndefined(xhr.status) && xhr.status != null)
            errorTrack += '-' + xhr.status;
        appLib.track(errorTrack);


        //## Inform user of error info
        if(err.indexOf('error') >= 0)
            appLib.alert(err);
    },

    showHomeButton: function () {
        $('#reviewStatus').html('Session complete');
        $('#reviewMainMenuButton').show();
        $('#uploadAnswersButton').hide();
    }
});
