var oeConstants = {	
    alpha: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],

    baseUrl: 'http://172.24.10.113:8080/',

    //======================= Constants
    version: '1.7.4',
    mrcpPart1: 1,
	
	emqAdditionalAnswer: '{{AdditionalAnswer}}'
};



//## Global object OE --- to be persisted to file or local storage
var oe = {
    //======================= Properties
    //## Questions
    questionBank: new QuestionBank(),

    userBaseBank: new UserBaseBank(),

    //## User
    auth: new Auth(),

    //## Sessions
    sessions: new Sessions(),

    //## Assessment Id - used by Work Smart
    assessmentId: null,

    //## Destination once logged in
    destination: null,

    //## Selected exam - this may be abandoned so don't disrupt the current session's examId
    selectedExamId: null,

    //## Local copy of demo exams - initially downloaded via API
    demoExams: [],

    //## Local copy of demo questions - initially downloaded via API
    //## Format: Array of { examId: int, questions: QuestionBank, updatedAt: int }
    demoQuestions: [],

    demoUsers: [],

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
            url: oeConstants.baseUrl + serviceName + '?cacheBuster=' + cacheBuster,
            data: JSON.stringify(data),
            success: function (data, textStatus) {

                
                

                appLib.maskUI(false);

                appLib.log('Ajax success');
                appLib.log(data);

                
                alert(JSON.stringify(data));

                
                successFunc(data, textStatus);
                
            },
            error: function (xhr, msg, err) {

                alert("fail");
                alert("msg");

                appLib.maskUI(false);

                appLib.log('Ajax error: ' + err + ' (' + msg + ')');
                appLib.log(xhr);
                errorFunc(xhr, msg, err);
            }
        };

        options = oe.addAjaxOptions(options);

        alert('Calling ' + oeConstants.baseUrl + serviceName + ' via ' + options.type + ' as ' + options.contentType);



        jQuery.ajax(options);
    },



    reset: function () {
        this.auth.reset();
        this.questionBank.reset();
        this.sessions.reset();

        //## Delete saved data
        window.localStorage.removeItem('oe');
    },



    startNewSession: function (showAnswers, showTimer) {
        //## Clear answers in the question bank
        this.questionBank.each(function (question) {
            question.clearAnswer();
        });


        //## Clear all sessions
        this.sessions.reset();


        //## Add a new session
        this.sessions.add(new Session({
            numQuestions: this.questionBank.length,
            showAnswer: showAnswers,
            showTimer: showTimer
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





    //## Load / Save data
    load: function () {
        var json = window.localStorage.getItem('oe');
        if (json == null)
            return;

        var data = JSON.parse(json);

        this.auth = new Auth(data.auth);
        this.sessions = new Sessions(data.sessions);
        this.questionBank = new QuestionBank(data.questionBank);

        this.assessmentId = data.assessmentId;
        this.selectedExamId = data.selectedExamId;

        //## Demo exams
        this.demoExams = data.demoExams;

        //## Demo questions - array of { examId: int, questions: questionObject, updatedAt: int }
        this.demoQuestions = data.demoQuestions;

    },

    save: function () {
        window.localStorage.setItem('oe', JSON.stringify(this));
    },



    //## Get the user's exam list
    getUserExams: function (onSuccess) {
        oe.ajax('GetActiveExams',
				{
				    token: oe.auth.get('key')
				},
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.Exams)) {
				        appLib.alert('Your exams could not be downloaded');
				        return;
				    } else if (data.d.ErrorMessage != null && data.d.ErrorMessage.length > 0) {
				        appLib.alert(data.d.ErrorMessage);
				        return;
				    } else if (data.d.Exams.length == 0) {
                        appLib.alert('You do not have any active subscriptions');
                        return;
					}

				    onSuccess(data.d.Exams, data.d.CurrentExamId);
				},
				function (xhr, msg, ex) {
				    if (oe.isLoginExpired(ex))
				        return;

				    //appLib.alert('Unable to download your exams');
				});
    },


    //## Get question types for an exam
    getQuestionTypes: function (onSuccess, examId) {
		var context = this;
	
        oe.ajax('GetQuestionTypes',
				{
				    token: oe.auth.get('key'),
				    examId: examId,
				    excludeNotSuitableForMobile: true
				},
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.QuestionTypes)) {
				        appLib.alert('Exam question types could not be downloaded');
				        return;
				    } else if (data.d.ErrorMessage != null && data.d.ErrorMessage.length > 0) {
				        appLib.alert(data.d.ErrorMessage);
				        return;
				    }

					//## Call success func with original context for [this]
				    $.proxy(onSuccess, context, data.d.QuestionTypes).apply();
				},
				function (xhr, msg, ex) {
				    if (oe.isLoginExpired(ex))
				        return;

				    //appLib.alert('Unable to download exam question types');
				});
    },


	getWorkHardOptions: function(numQuestions, questionTypes) {
		//questionTypeOptions: questionTypes
        var questionTypeOptions = [];

        //## Apply questionTypes filters if specified
        if (questionTypes != null) {
            var qt = _.map(questionTypes, function (type) {
                return {
                    NumberOfQuestions: 0,
                    QuestionType: type
                }
            });

            questionTypeOptions = qt;
        }

        
        var optionsWrapper = {
            AssessmentType: 'WorkHardMobile',
            UserId: oe.auth.get('userId'),
            DisableImageZoom: true,

            QuestionFilter: {
                ExamId: oe.selectedExamId,
                ExcludeNotSuitableForMobileDevices: true,
                ExcludeMediaQuestions: false,

                QuestionTypes: questionTypeOptions
            }
        };


        var options = {
            token: oe.auth.get('key'),
            numberOfQuestions: numQuestions,
            options: optionsWrapper
        };
		
		return options;
	},
	
	
	//## Get status of specified work hard exam
	getWorkHardStatus: function(onSuccess, questionTypes) {
		var options = oe.getWorkHardOptions(0, questionTypes);
		var context = this;
		
		oe.ajax('GetWorkHardStatus',
				options,
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.WorkHard) || _.isUndefined(data.d.WorkHard.QuestionsAnswered) || _.isUndefined(data.d.WorkHard.TotalQuestions)) {
				        appLib.alert('No work hard statistics could be downloaded');
				        return;
				    }

				    $.proxy(onSuccess, context, data.d.WorkHard.QuestionsAnswered, data.d.WorkHard.TotalQuestions).apply();
				},
				function (xhr, msg, ex) {
				    if (oe.isLoginExpired(ex))
				        return;

				    
				});
	},
	

	//## Download work hard questions
    workHard: function (onSuccess, numQuestions, questionTypes) {
		var options = oe.getWorkHardOptions(numQuestions, questionTypes);

        //## Request questions
        oe.ajax('GetWorkHardQuestions',
				options,
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.WorkHard) || _.isUndefined(data.d.WorkHard.Questions) || _.isUndefined(data.d.WorkHard.AssessmentId)) {
				        appLib.alert('No work hard questions could be downloaded');
				        return;
				    }

				    oe.loadQuestions(data.d.WorkHard.Questions,
                                     data.d.WorkHard.AssessmentId,
                                     oe.downloadImages,
                                     onSuccess,
                                     function () {
                                         appLib.alert('No work hard questions are available for these filters');
                                     });
				},
				function (xhr, msg, ex) {
				    if (oe.isLoginExpired(ex))
				        return;

				    

				});
    },


    //## Work Smart question type enum
    workSmartQuestionType: {
        NotSeenBefore: 0,
        AllQuestions: 1,
        WrongBefore: 2,
        Tagged: 3
    },

    //## Returns a work smart options object that can be used to create an assessment or calculate the number of available questions
    getWorkSmartOptions: function (questionType, minDifficulty, maxDifficulty, categories, numQuestions, examId, questionTypes) {
        var onlyTagged, excludeNew, excludeOld, excludeCorrect, excludeWrong;

        if (questionType == oe.workSmartQuestionType.NotSeenBefore) {
            onlyTagged = false;
            excludeNew = false;
            excludeOld = true;
            excludeCorrect = true;
            excludeWrong = true;
        } else if (questionType == oe.workSmartQuestionType.AllQuestions) {
            onlyTagged = false;
            excludeNew = false;
            excludeOld = false;
            excludeCorrect = false;
            excludeWrong = false;
        } else if (questionType == oe.workSmartQuestionType.WrongBefore) {
            onlyTagged = false;
            excludeNew = true;
            excludeOld = false;
            excludeCorrect = true;
            excludeWrong = false;
        } else if (questionType == oe.workSmartQuestionType.Tagged) {
            onlyTagged = true;
            excludeNew = false;
            excludeOld = false;
            excludeCorrect = false;
            excludeWrong = false;
        }

        var options = {
            __type: 'DABL.GenericAssessment.DTO.AssessmentOptionsDTO',
            Id: 1,
            NumberOfQuestions: numQuestions,
            ExamId: examId,
            TaggedQuestionsOnly: onlyTagged,
            ExcludeNewQuestions: excludeNew,
            ExcludeOldQuestions: excludeOld,
            ExcludeCorrectQuestions: excludeCorrect,
            ExcludeIncorrectQuestions: excludeWrong,
            Difficulty: {
                MinimumDifficulty: minDifficulty,
                MaximumDifficulty: maxDifficulty
            },
            AdaptForMe: true,
            AllowSkip: true,
            /*
            QuestionTypes: [
            {
            NumberOfQuestions: numQuestions,
            //QuestionType: 'nOfMany'
            //QuestionType: 'MCQ'
            QuestionType: 'EMQ'
            }
            ],
            */
            ShowAnswers: true,
            ShowExplanations: true,
            AssessmentType: 'WorkSmartMobile',
            ExcludeMediaQuestions: false
        };

        //## Apply category filters if specified
        if (categories != null)
            _.extend(options, { Curricula: categories });

        //## Apply questionTypes filters if specified
        if (questionTypes != null) {
            var qt = _.map(questionTypes, function (type) {
                return {
                    NumberOfQuestions: 0,
                    QuestionType: type
                }
            });

            _.extend(options, { QuestionTypes: qt });
        }

        return options;
    },


    //## Downloads work smart questions into the local question bank
    workSmart: function (onSuccess, questionType, minDifficulty, maxDifficulty, categories, numQuestions, examId, questionTypes) {
        var options = this.getWorkSmartOptions(questionType, minDifficulty, maxDifficulty, categories, numQuestions, examId, questionTypes);

        //## Create a function to be called once an assessment has been created
        var downloadWorkSmartQuestion = function (onSuccess, assessmentId) {
            oe.ajax('GetUnansweredsQuestions',
					{
					    token: oe.auth.get('key'),
					    assessmentId: assessmentId
					},
					function (data, textStatus) {
					    if (_.isUndefined(data.d) || _.isUndefined(data.d.Questions)) {
					        appLib.alert('No work smart questions could be downloaded');
					        return;
					    }

					    oe.loadQuestions(data.d.Questions, assessmentId, oe.downloadImages, onSuccess, jQuery.noop);
					},
					function (xhr, msg, ex) {
					    if (oe.isLoginExpired(ex))
					        return;

					    if (ex.indexOf('GetUnansweredsQuestions error') > -1) {
					        appLib.alert('No work smart questions could be downloaded.');
					    } else {
					        appLib.alert(ex);
					    }
					    /*
					    if(msg.indexOf('No questions found') != -1)
					    appLib.alert('No questions match the selected filters');
					    else
					    appLib.alert('Error downloading work smart questions');
					    */
					});
        };

        //## TODO: If question options have not changed then the previous assessmentId can be re-used and only the above ajax request is required
        oe.ajax('CreateAssessment',
				{
				    token: oe.auth.get('key'),
				    assessmentName: 'mobile',
				    optionsDTO: options
				},
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.AssessmentId)) {
				        //pLib.alert('No assessment could be downloaded');
				        return;
				    }

				    downloadWorkSmartQuestion(onSuccess, data.d.AssessmentId);
				},
				function (xhr, msg, ex) {
				    if (oe.isLoginExpired(ex))
				        return;

				    //pLib.alert('Unable to download work smart questions');
				});
    },


    //## Downloads the number of available work smart questions based on the specified criteria
    workSmartQuestionCount: function (onSuccess, questionType, minDifficulty, maxDifficulty, categories, examId, questionTypes) {
        var options = this.getWorkSmartOptions(questionType, minDifficulty, maxDifficulty, categories, 0, examId, questionTypes);

        oe.ajax('GetQuestionCount',
				{
				    token: oe.auth.get('key'),
				    optionsDTO: options
				},
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.QuestionCount)) {
				        appLib.alert('No question count could be downloaded');
				        return;
				    }

				    onSuccess(data.d.QuestionCount);
				},
				function (xhr, msg, ex) {
				    if (oe.isLoginExpired(ex))
				        return;

				    //if(ex.indexOf('GetQuestionCount error') > 0)
				    //appLib.alert('Unable to download work smart question count');
				});
    },


    isLoginExpired: function (msg) {
        if (msg.indexOf('Invalid token') >= 0) {
            appLib.alert('Your session has expired. Please login again.', function () { app.trigger('loginRequired'); });
            return true;
        }

        return false;
    },

    //## Load specified questions into the local question bank, and optionally downloads images to local storage
    loadQuestions: function (questions, assessmentId, downloadImages, onSuccess, onFailure) {
		//appLib.log('loadQuestions()');
	
        var qbank = new QuestionBank();

        _.each(questions, function (el, index, list) {
            //## Process question options including the correct answer
            var options = new QuestionOptions();
            var questionType = el.QuestionType;

            if (questionType == 1) {
                //## Add MCQ options
                _.each(el.QuestionAnswer.AnswerItems, function (item) {
                    options.add(
					    new MCQOption({
					        id: item.Id,
					        answer: item.Answer,
					        answerText: item.AnswerText
					    })
				    );
                });

                qbank.add(
				    new MCQ({
				        id: el.QID,
				        text: oe.processQuestionText(el.QuestionText),
				        comment: oe.processQuestionText(el.QuestionAnswer.Explanation),
				        options: options
				    })
			    );


            } else if (questionType == 2) {
                //## Add EMQ question stems
                _.each(el.QuestionAnswer.AnswerItems, function (item) {
                    options.add(
					    new EMQOption({
					        id: item.Id,
					        text: item.IntroText,
					        comment: item.Explanation,
					        answerId: item.CorrectOptionId
					    })
				    );
                });


                //## Add the choices for the ddlb
                var choices = new EMQChoices();

                _.each(el.QuestionAnswer.AnswerOptions, function (item) {
                    choices.add(
                        new EMQChoice({
                            id: item.Id,
                            score: item.Score,
                            text: item.Text,
                            comment: item.Comment
                        })
                    );
                });


                //## Add the question
                qbank.add(
				    new EMQ({
				        id: el.QID,
				        text: oe.processQuestionText(el.QuestionText),
				        comment: oe.processQuestionText(el.QuestionAnswer.Explanation),
				        options: options,
				        choices: choices,
				        theme: el.Theme
				    })
			    );


            } else if (questionType == 4) {
                //## Add NoM/BoF options
                _.each(el.QuestionAnswer.AnswerItems[0].AnswerOptions, function (item) {
                    options.add(
					    new QuestionOption({
					        id: item.Id,
					        text: item.Text,
					        score: item.Score
					    })
				    );
                });

                if (el.NumberOfOptions > 1 || el.SelectAllThatApply) {
                    //## N of Many
                    qbank.add(
				        new NOM({
				            id: el.QID,
				            text: oe.processQuestionText(el.QuestionText),
				            comment: oe.processQuestionText(el.QuestionAnswer.Explanation),
				            options: options,
				            numberOfOptions: el.NumberOfOptions,
				            selectAllThatApply: el.SelectAllThatApply
				        })
			        );
                } else {
                    //## Best of 5
                    qbank.add(
				        new BestOfFive({
				            id: el.QID,
				            text: oe.processQuestionText(el.QuestionText),
				            comment: oe.processQuestionText(el.QuestionAnswer.Explanation),
				            options: options
				        })
			        );
                }


            } else if (questionType == 9) {
                //## Add SJQ options
                _.each(el.QuestionAnswer.AnswerItems, function (item) {
                    options.add(
					    new SJQOption({
					        id: item.Id,
					        rank: item.Rank,
					        answerText: item.AnswerText
					    })
				    );
                });

                qbank.add(
				    new SJQ({
				        id: el.QID,
				        text: oe.processQuestionText(el.QuestionText),
				        comment: oe.processQuestionText(el.QuestionAnswer.Explanation),
				        options: options
				    })
			    );
				
				
            } else if (questionType == 10) {
				//## Add SJT options
                _.each(el.QuestionAnswer.AnswerItems, function (item) {
                    options.add(
					    new SJTOption({
					        id: item.Id,
					        rank: item.Rank,
					        answerText: item.AnswerText
					    })
				    );
                });

                qbank.add(
				    new SJT({
				        id: el.QID,
				        text: oe.processQuestionText(el.QuestionText),
				        comment: oe.processQuestionText(el.QuestionAnswer.Explanation),
				        options: options
				    })
			    );			
			}
        });

		//appLib.log('loadQuestions() checking length');

        //## Ensure qbank is not empty before replacing current session
        if (qbank.length == 0) {
            onFailure();
            return;
        }


        //## Function to run on completion of this func
        var onCompletion = function () {
            //## Make the new questions active
            oe.questionBank = qbank;
            oe.assessmentId = assessmentId;

            onSuccess();
        };

		//appLib.log('loadQuestions() about to check for images');

        //## Download images to local storage?
        if (downloadImages)
            oe._downloadImagesInQuestionBank(qbank, onCompletion);
        else
            onCompletion();
    },


    //## Replace oE website specific text/links in question text
    processQuestionText: function (text) {
		//## Ensure the html is safe as below code will eval() it
		var safeText = oe._disableScriptTagsInHtml(text);
		
		var html = $('<html>').html(safeText);
		$('a', html).each(function(i, el) { 
			//## Get href and strip partial OE redirect page if present
			var url = $(el).attr('href').split('/goto.aspx?url=').join('');
			$(el).removeAttr('href').removeAttr('target').attr('onclick','window.open(\'http://www.onexamination.com/goto.aspx?url=' + url + '\', \'_system\');'); 
		});
		
		//## Running   $('<html>').html('example question text')   on modern browsers generates: 
		// 			<html><head></head><body>example question text</body></html> 
		//## However, on Android 2.x it generates:
		//			example question text
		//## Therefore, test for a body element and if available return it's content otherwise return all content
		return ($('body', html).length > 0 ? $('body', html).html() : $(html).html());
    },



    //## Download images from question bank to local storage
    _downloadImagesInQuestionBank: function (questions, onCompletion) {
        appLib.maskUI(true);

		//appLib.log('_downloadImagesInQuestionBank() about to look for images');
		
        //## Build an array of unique image urls from all questions
        var uniqueImageUrls = [];
        questions.each(function (q) {
            //## Find images inside question and comment text
            var images = [].concat(_.toArray(imageLib.findImages(q.get('text'))), _.toArray(imageLib.findImages(q.get('comment'))));

            //## Extract URLs from <img/> tags
            var urls = _.map(images, function (img) {
                return $(img).attr('src');
            });

            uniqueImageUrls = uniqueImageUrls.concat(urls);
        });

		//appLib.log('_downloadImagesInQuestionBank() finished .each');

        var stripImageDimentionsAndRemapUrl = function (imgEl) {
            //## Caching issue with local images!
            var currentTime = new Date();
            var cacheBuster = currentTime.getTime();
        
            //## Attempt to replace with local image data
            var src = imgEl.attr('src');
            imgEl.attr('src', imageLib.getImage(src, true) + '?cacheBuster=' + cacheBuster);

            //## Strip width/height attributes
            imgEl.removeAttr('width').removeAttr('height');
            
            //## Useful for debugging - also displays original image from website (first)
            //imgEl.before('<img src="' + src + '" />');
        };


        //## Download images
        imageLib.downloadImages(uniqueImageUrls, function() {

            //## Process question elements - attempt to replace image url with local image data
            questions.each(function (q) {
				//appLib.log('_downloadImagesInQuestionBank() processing question');
				
                q.set('text', imageLib.processImages(q.get('text'), stripImageDimentionsAndRemapUrl));
                q.set('comment', imageLib.processImages(q.get('comment'), stripImageDimentionsAndRemapUrl));
            });

            appLib.maskUI(false);

			//appLib.log('_downloadImagesInQuestionBank() calling onCompletion');
			
            onCompletion();
        });
    },

	
	//## Disables HTML script tags by commenting them out
	_disableScriptTagsInHtml: function(html) {					
		return html.split('<script').join('<!-- /* ').split('</script').join('*/ -->');
	},


    //## Returns the required answer set (either Work Hard or Work Smart) to upload
    getAnswersToUpload: function () {
        var answersToUpload = [];

        this.questionBank.each(function (question) {
            var answer = question.get('lastAnswer');

            if (answer != null && !answer.get('uploaded')) {
                answersToUpload.push(answer.getUserAnswerDTO());
            }
        });


        //## Don't return an object to upload if there are no answers!
        if (answersToUpload == null || answersToUpload.length == 0)
            return null;


        if (oe.assessmentId == null) {
            //## Old Work hard questions - downloaded before updating to new version of the app
            return {
                token: this.auth.get('key'),                
                userAnswers: answersToUpload,
                options: {
                    AssessmentType: 'WorkHardMobile',
                    UserId: this.auth.get('userId'),
                    QuestionFilter: {
                        ExamId: oe.selectedExamId
                    }
                },                
                url: function () { return oeConstants.baseUrl + 'AnswerWorkHardQuestions'; }
            };
        } else {
            //## Work Smart / New Work Hard
            return {
                token: this.auth.get('key'),
                assessmentId: oe.assessmentId,
                answers: answersToUpload,
                userId: this.auth.get('userId'),
                url: function () { return oeConstants.baseUrl + 'AnswerQuestions'; }
            };
        }



    },

    markAnswersAsUploaded: function () {
        this.questionBank.each(function (question) {
            var answer = question.get('lastAnswer');

            if (answer != null)
                answer.set('uploaded', true);
        });
    },




    //## Gets curricula for the specified exam
    getCurricula: function (onSuccess, examId) {
        oe.ajax('GetCurriculaForExam',
			    {
			        token: oe.auth.get('key'),
			        examId: examId
			    },
				function (data) {
				    onSuccess(oe.getParentCurricla(data.d.Curricula));
				},
				function (xhr, msg, errorThrown) {
				    if (oe.isLoginExpired(errorThrown))
				        return;

				    appLib.alert(errorThrown);
				});
    },

    //## Converts a hierarchy of curricula into a flat key/value list where the value is csv with the parent id first (e.g. parent,child1,child2)
    getParentCurricla: function (curricula) {
        var parentItems = [];

        _.each(curricula, function (item) {
            var title = item.Name;
            var ids = oe.getChildCurriculaIds(item);

            parentItems.push({ key: title, value: ids });
        });

        return parentItems;
    },

    //## Recursive function that processes child curricula for IDs
    getChildCurriculaIds: function (item) {
        var ids = item.CurriculumID;

        if (!_.isUndefined(item.Children))
            _.each(item.Children, function (c) {
                ids += ',' + oe.getChildCurriculaIds(c);
            });

        return ids;
    },


    //## Get demo exams
    getDemoExams: function (onSuccess, onError) {
        oe.ajax('GetExamsWithDemoQuestions',
				{},
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.Exams)) {
				        //appLib.alert('Unable to download demo resources');
				        return;
				    } else if (data.d.ErrorMessage != null && data.d.ErrorMessage.length > 0) {
				        appLib.alert(data.d.ErrorMessage);
				        return;
				    }

				    //## Save demo exams list
				    if (data.d.Exams.length > 0)
				        oe.demoExams = data.d.Exams;

				    onSuccess(data.d.Exams);
				},
				function (xhr, msg, ex) {
				    //## Don't warn about being unable to download demo exam list
				    onError();
				});
    },


    //## Get last changed demo question datetime
    getDemoLastChangeDate: function (examId, onSuccess, onError) {
        oe.ajax('GetDemoQuestionLastChangeDate',
				{
				    examId: examId
				},
				function (data, textStatus) {
				    if (_.isUndefined(data.d)) {
				        //appLib.alert('Unable to download demo metadata');
				        return;
				    }

				    //## Convert date to an int
				    onSuccess(parseInt(data.d.substr(6)));
				},
				function (xhr, msg, ex) {
				    //## Don't warn about being unable to download demo exam list
				    onError();
				});
    },


    //## Download demo questions and setup in current question bank
    getDemoQuestions: function (examId, onSuccess, onError) {
        oe.ajax('GetDemoQuestions',
				{
				    examId: examId
				},
				function (data, textStatus) {
				    if (_.isUndefined(data.d) || _.isUndefined(data.d.Questions)) {
				        appLib.alert('No demo questions could be downloaded');
				        return;
				    }

				    oe.loadQuestions(data.d.Questions,
                                     null,
                                     oe.downloadImages,
                                     function () {
                                         onSuccess(data.d.Questions, parseInt(data.d.LastChangeDate.substr(6)));
                                     },
                                     function () {
                                         appLib.alert('No demo questions are available for this exam');
                                     });
				},
				function (xhr, msg, ex) {
				    onError();
				});
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