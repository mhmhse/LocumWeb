//## ----------------- ROUTER
var AppRouter = Backbone.Router.extend({

    routes: {
        "": "home",
        "Login": "loginView",
        "SearchForDoctor/:query": "searchForDoctorView",
        "SearchForHospital": "searchForHospitalView",
        "SearchHospitalResult/:query1/:query2/:query3/:query4": "searchHospitalResultView"
    },


    initialize: function () {
        //## Handle back button throughout the application
        $(document).on('click', '.back', function (event) {
            window.history.back();
            return false;
        });
        this.firstPage = true;



        //## Fired by view
        this.on('home', function () {
            //## Return to home screen			
            this.navigate("", { trigger: true, replace: true });
        });

        this.on('SearchForHospital', function () {
            this.navigate("SearchForHospital", { trigger: true, replace: true });
        });

        this.on('SearchHospitalResult', function (argus) {
            this.navigate("SearchHospitalResult" + argus.getQueryString(), { trigger: true, replace: true });
        });

        //## Load data?
        lm.load();
    },



    //##===================== ROUTE METHODS

    //## Home view
    home: function () {
        appLib.track('home');

        if (!lm.auth.get('email')) {

            this.navigate('Login', { trigger: true, replace: true });
            return;
        }

        this.changePage(new HomeView({ model: lm.currentSession() }));
    },

    //## Login
    loginView: function () {

        if (lm.auth.get('key') != null) {
            //## Don't login - key already present
            this.navigate('SearchDoctor', { trigger: true, replace: true });
            return;
        }

        appLib.track('login');

        this.changePage(new LoginView({ model: lm }));
    },

    //## search Doctor View
    searchForHospitalView: function () {

        appLib.track('searchForHospitalTemplate');

        this.changePage(new SearchForHospitalView({ model: lm }));
    },

    //## search Doctor View
    searchHospitalResultView: function () {

        appLib.track('searchHospitalResultTemplate');

        this.changePage(new SearchHospitalResultView({ model: lm }));
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
