//## ----------------- ROUTER
var AppRouter = Backbone.Router.extend({

    routes: {
        "": "loginView",
        "SelectDemoExam": "demoExamMenu",
        "Settings": "settingsMenu",
        "GettingStarted": "gettingStartedMenu",
        "TermsConditions": "termsConditionsMenu",
        "PrivacyPolicy": "privacyPolicyMenu",
        "Login": "loginView",
        "Register": "registerView",
        "SearchDoctor": "searchDoctorView",
        "SearchDoctorResult": "searchDoctorResultView",
        "Demo": "demoMenu",
        "RevisionTypeMenu": "revisionTypeMenu",
        "QuestionBrowser": "questionBrowserView",
		"QuestionBrowser/:hash": "questionBrowserView",
        "QuestionBrowserAnswer": "questionBrowserAnswerView",
        "SessionReview": "sessionReview",
        "PreviousQuestion": "previousQuestion",
        "NextQuestion": "nextQuestion"
    },


    initialize: function () {
        //## Handle back button throughout the application
        $(document).on('click', '.back', function (event) {
            window.history.back();
            return false;
        });
        this.firstPage = true;



        //## Fired by view
        this.on('startQuestions', function (showAnswers, showTimer) {
            oe.startNewSession(showAnswers, showTimer);
            oe.save();

            this.navigate("QuestionBrowser", { trigger: true, replace: true });
        });

        this.on('startDemoQuestions', function () {
            //## Clear username details
            oe.auth.reset();

            oe.startNewSession(true, false);
            oe.save();

            appLib.track('start-demo-questions');
            this.navigate("QuestionBrowser", { trigger: true, replace: true });
        });
		
        this.on('continueQuestions', function (questionId) {
            appLib.track('jump-to-question');
            this.navigate("QuestionBrowser/" + questionId, { trigger: true, replace: true });
        });		
		
        this.on('SearchDoctor', function () {
            this.navigate("SearchDoctor", { trigger: true, replace: true });
        });

        this.on('SearchDoctorResult', function () {
            this.navigate("SearchDoctorResult", { trigger: true, replace: true });
        });

        this.on('selectRevisionType', function () {
            this.navigate("RevisionTypeMenu", { trigger: true, replace: true });
        });

        //## Fired by question models
        this.on('questionAnswered', function () {
            oe.save();

            //## Show the answer section
            this.navigate("QuestionBrowserAnswer", { trigger: true, replace: true });
        });

        this.on('viewSessionResults', function () {
            this.navigate("SessionReview", { trigger: true, replace: true });
        });

        this.on('loginRequired', function (destination) {
            //## Clear user login details
            oe.auth.reset();

            if (_.isUndefined(destination))
                oe.destination = null;
            else
                oe.destination = destination;

            this.navigate("Login", { trigger: true, replace: true });
        });

        this.on('home', function () {
            //## Return to home screen			
            this.navigate("", { trigger: true, replace: true });
        });


        //## Load data?
        oe.load();
    },



    //##===================== ROUTE METHODS

    //## Home view
    home: function () {
        appLib.track('home');

        this.changePage(new HomeView({ model: oe.currentSession() }));
    },



    //## Demo Exam menu
    demoExamMenu: function () {
        appLib.track('demo exam menu');

        this.changePage(new DemoExamView({ model: oe.auth }));
    },

    //## Settings 
    settingsMenu: function () {
        appLib.track('settings');

        this.changePage(new SettingsView({ model: oe.auth }));
    },

    //### Getting Started
    gettingStartedMenu: function () {
        appLib.track('getting-started');

        this.changePage(new GettingStartedView({ model: oe.currentSession }));
    },

    //### Terms & Conditions
    termsConditionsMenu: function () {
        appLib.track('terms');

        this.changePage(new TermsConditionsView({ model: oe.currentSession }));
    },


    //### Privacy Policy
    privacyPolicyMenu: function () {
        appLib.track('privacy');

        this.changePage(new PrivacyPolicyView({ model: oe.currentSession }));
    },


    //## Login
    loginView: function () {
        if (oe.auth.get('key') != null) {
            //## Don't login - key already present
            this.navigate('SearchDoctor', { trigger: true, replace: true });
            return;
        }

        appLib.track('login');

        this.changePage(new LoginView({ model: oe.auth }));
    },

    //## Register
    registerView: function () {
        if (oe.auth.get('key') != null) {
            //## Don't login - key already present
            this.navigate('SearchDoctor', { trigger: true, replace: true });
            return;
        }

        appLib.track('RegisterTemplate');

        this.changePage(new RegisterView({ model: oe.auth }));
    },

    //## search Doctor View
    searchDoctorView: function () {

        appLib.track('searchDoctorTemplate');

        this.changePage(new SearchDoctorView({ model: oe.auth }));
    },


    //## searchDoctorResultView
    searchDoctorResultView: function () {

        appLib.track('SearchDoctorResultTemplate');

        this.changePage(new SearchDoctorResultView({ model: oe.auth }));
    },


    //## Demo menu
    demoMenu: function () {
        appLib.track('demo-menu');

        this.changePage(new DemoView());
    },


    //## Revision Type Menu view
    revisionTypeMenu: function () {
        appLib.track('revision-type-menu');

        this.changePage(new RevisionTypeMenuView({ model: null }));
    },


    //## Question view
    questionBrowserView: function () {
        if (oe.currentSession().isCompleted()) {
            //## Jump to the review screen
            this.navigate("SessionReview", { trigger: true, replace: true });
            return;
        }

        var q = oe.questionBank.at(oe.currentSession().get('questionIndex'));

        if (q.isAnswered()) {
            //## If answered then show selected answer & explanation		
            this.navigate("QuestionBrowserAnswer", { trigger: true, replace: true });
            return;
        }


        appLib.track('view-question');
        
        /*
        if(q.get('text').indexOf('<img') > 0 || q.get('comment').indexOf('<img') > 0)
            appLib.log('=== Contains Image ===');
        */

        var view;
        if (q.get('type') == QuestionTypes.MCQ)
            view = new MCQView({ model: q });
        else if (q.get('type') == QuestionTypes.EMQ)
            view = new EMQView({ model: q });
        else if (q.get('type') == QuestionTypes.SJQ || q.get('type') == QuestionTypes.SJT)
            view = new SJQView({ model: q });
        else if (q.get('type') == QuestionTypes.NOM)
            view = new NOMView({ model: q });
        else
            view = new QuestionBrowserView({ model: q });

        this.changePage(view);
    },


    //## Answered question view
    questionBrowserAnswerView: function () {
        if (oe.currentSession().isCompleted()) {
            //## Jump to the review screen
            this.navigate("SessionReview", { trigger: true, replace: true });
            return;
        }
        else if (!oe.currentSession().get('showAnswer')) {
            //## Skip showing the answer
            this.navigate("NextQuestion", { trigger: true, replace: true });
            return;
        }

        var q = oe.questionBank.at(oe.currentSession().get('questionIndex'));

        if (!q.isAnswered()) {
            //## Security: If question isn't answered then show question - not explanation!		
            this.navigate("QuestionBrowser", { trigger: true, replace: true });
            return;
        }


        appLib.track('view-answer');

        var view;
        if (q.get('type') == QuestionTypes.MCQ)
            view = new MCQAnsweredView({ model: q });
        else if (q.get('type') == QuestionTypes.SJQ || q.get('type') == QuestionTypes.SJT)
            view = new SJQAnsweredView({ model: q });
        else if (q.get('type') == QuestionTypes.EMQ)
            view = new EMQAnsweredView({ model: q });
        else if (q.get('type') == QuestionTypes.NOM)
            view = new NOMAnsweredView({ model: q });
        else
            view = new QuestionBrowserAnswerView({ model: q });
        
        this.changePage(view);
    },


    //## Review the current session
    sessionReview: function () {
        appLib.track('session-review');

        //## Security: Should we ensure all questions are answered?
        oe.currentSession().set('completed', true);
        oe.save();

        var view = new SessionReviewView({ model: oe.currentSession() });
        this.changePage(view);
    },


    //## Request previous question
    previousQuestion: function () {
        this.moveToPreviousQuestion();

        oe.save();

        appLib.track('previous-question');
        this.navigate("QuestionBrowser", { trigger: true, replace: true });
    },


    //## Request next question
    nextQuestion: function () {
        if (oe.currentSession().allQuestionsAnswered()) {
            //## Show session review
            this.navigate("SessionReview", { trigger: true, replace: true });
            return;
        }

        this.moveToNextQuestion();

        oe.save();

        appLib.track('next-question');
        this.navigate("QuestionBrowser", { trigger: true, replace: true });
    },




    //##================= HELPER METHODS

    //## Move to the previous question
    moveToPreviousQuestion: function () {
        var index = oe.currentSession().get('questionIndex') - 1;

        if (index < 0)
            index = oe.questionBank.length - 1;

        oe.currentSession().set('questionIndex', index);
    },

    //## Move to the next question
    moveToNextQuestion: function () {
        var index = oe.currentSession().get('questionIndex') + 1;

        if (index >= oe.questionBank.length)
            index = 0;

        oe.currentSession().set('questionIndex', index);
    },


    //## Change page
    changePage: function (page) {
        appLib.log('====> Page change start');
                                       
        $(page.el).attr('data-role', 'page');
           						
        try {
            page.render();
        } catch(ex) {
            appLib.log('Page change exception: ' + ex);
        }
                                       
        $('body').append($(page.el));
		var transition = $.mobile.defaultPageTransition;		
		
		//## Disable transitions for android to speed up page changes
		if(appLib.getDevice() == 'android') {        
			transition = 'none';
		}

        //## We don't want to slide the first page
        if (this.firstPage) {
            transition = 'none';
            this.firstPage = false;

            //## Create loading mask 
            $('body').append('<div id="block-ui"><span id="spinner"></span><br /><h1>Loading...</h1></div>');
        }
         
		//## Ensure question area is at least as tall as the device height
		$('.questionPage').css('min-height', $(window).height() - 170);
		$('.answerPage').css('min-height', $(window).height() - 170);
		
		
        $.mobile.changePage($(page.el), { changeHash: false, transition: transition });
                                       
        appLib.log('====> Page change complete');
    }
});
