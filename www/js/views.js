//## ----------------- VIEWS

//## Home
var HomeView = Backbone.View.extend({


    template: _.template($('#HomeTemplate').html()),

    render: function (eventName) {


		var hideContinueSession = _.isUndefined(this.model) || this.model == null;		
		var continueSessionButtonStyle = (hideContinueSession ? 'display:none;' : '');


		var loginStyle = (lm.auth.get('email') ? 'display:none;' : '');


		
		var html = this.template({ buttonStyle: loginStyle });
        $(this.el).html(html);		
                                    
        return this;
    }
});

//========================================================================================

//## Login	
var LoginView = Backbone.View.extend({
    template: _.template($('#LoginTemplate').html()),

    render: function (eventName) {
        var registerStyle = (lm.destination == null ? '' : 'display:none;');

        $(this.el).html(this.template({ registerStyle: registerStyle }));

        return this;
    },


    events: {
        "click #login-button": "login"
    },

    login: function () {
        var email = this.$('#email').val()
        var password = this.$('#password').val();

        this.tryAuth(email, password);
    },


    tryAuth: function (email, password) {
        var view = this;

        lm.ajax('login',
				{
				    name: email,
                    password: password
				},
				function (data, textStatus) {

				    if (!_.isUndefined(data) && !_.isUndefined(data.valid)) {

				        if (data.valid) {

				            lm.auth.set('email', email);

				            var locumRole = data.locumRole

				            var appEvent = '';
				            if (locumRole && locumRole.toLowerCase().indexOf('hos') >= 0) {

				                lm.auth.set('userDetails', new HospitalUser());
				                appEvent = 'SearchForDoctor';
				            } else {

				                lm.auth.set('userDetails', new DoctorUser());
				                appEvent = 'SearchForHospital';
				            }
				           

				            if (lm.currentSession() == null) {

				                lm.startNewSession();
				            }
				            var currSession = lm.currentSession();

				            var searchParameter = currSession.get('searchParameter');
				            var userDetails = lm.auth.get('userDetails');
				            if (searchParameter == null) {

				                searchParameter = new SearchParameters(userDetails);
				            }

				            app.trigger(appEvent);
				        }
				    }
				},
				function (xhr, msg, errorText) {
				    alert("can't access webservice");
				});

    }
});

//========================================================================================

//## Search For Hospital
var SearchForHospitalView = Backbone.View.extend({
    template: _.template($('#SearchForHospitalTemplate').html()),

    render: function (eventName) {
        //## Get the user's exams
        $(this.el).html(this.template({ specialities: specialities.toJSON(), grades: grades.toJSON() }));
        
        return this;
    },

    events: {
        "click #searchHospital": "searchHospital"
    },

    searchHospital: function () {

        if (this.model.currentSession() == null) {

            this.model.startNewSession();
        }
        var currSession = this.model.currentSession();

        var searchParameter = currSession.get("searchParameter");
        if (searchParameter == null) {

            searchParameter = new SearchParameters();
        }

        searchParameter.grade = this.$('#grade').val();
        searchParameter.speciality = this.$('#speciality').val();
        searchParameter.range = this.$('#range').val();

        
        app.trigger('SearchHospitalResult',
            searchParameter
        );
    }
});


//========================================================================================
//## Search Doctor Review
var SearchHospitalResultView = Backbone.View.extend({
    template: _.template($('#SearchHospitalResultTemplate').html()),

    render: function (eventName) {

        
        $(this.el).html(this.template({}));

        return this;
    },

    events: {
        "click #viewSavedList": "viewSavedList",
        "swipeleft": "denyUser",
        "swiperight": "saveUser",
    },

    viewSavedList: function () {

        app.trigger('SearchDoctorList');
    },
    saveUser: function (e) {
        
        if (this.model.currentSession() == null) {

            this.model.startNewSession();
        }
        var currSession = this.model.currentSession();

        var currIMG = $(".buddy:nth-child(" + currSession.get("showUserIndex") + ")");
        currIMG.addClass('rotate-left').delay(700).fadeOut(1);
        $('.buddy').find('.status').remove();
        currIMG.append('<div class="status like">Save!</div>');

        if (currIMG.is('.buddy:last')) {

            $('.buddy:nth-child(1)').removeClass('rotate-left rotate-right').delay(700).fadeIn(300);
            currSession.set("showUserIndex", 1);
        } else {
            currIMG.next().removeClass('rotate-left rotate-right').delay(700).fadeIn(400);
            currSession.set("showUserIndex", currSession.get("showUserIndex") + 1);
        }

    },
    denyUser: function (e) {


        if (this.model.currentSession() == null) {

            this.model.startNewSession();
        }
        var currSession = this.model.currentSession();

        var currIMG = $(".buddy:nth-child(" + currSession.get("showUserIndex") + ")");
        currIMG.addClass('rotate-right').delay(700).fadeOut(1);
        $('.buddy').find('.status').remove();
        currIMG.append('<div class="status dislike">Discard!</div>');
        if (currIMG.is('.buddy:last')) {
            $('.buddy:nth-child(1)').removeClass('rotate-left rotate-right').delay(700).fadeIn(300);
            currSession.set("showUserIndex", 1);
        } else {
            currIMG.next().removeClass('rotate-left rotate-right').delay(700).fadeIn(400);
            currSession.set("showUserIndex", currSession.get("showUserIndex") + 1);
        }
    }
});
