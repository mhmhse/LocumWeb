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
//## Search Hospital Review
var SearchHospitalResultView = Backbone.View.extend({
    template: _.template($('#SearchHospitalResultTemplate').html()),

    render: function (eventName) {

        var searchParameter = lm.getCurrentSessionOrNewSession().get("searchParameter");

        
        //TODO
        //var searchedResult = lm.search(searchParameter);
        var searchedResult = new SearchedResult([

            new SearchedRow({

                name: 'test1',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/BCH.jpg',
                tel: 'teltest1',
                grade: 'gradetest1',
                specialty: 'specialtytest1',
                postcode: 'postcodetest1',
                operation: null
            }),
            new SearchedRow({

                name: 'test2',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/BWH.jpg',
                tel: 'teltest2',
                grade: 'gradetest2',
                specialty: 'specialtytest2',
                postcode: 'postcodetest2',
                operation: null
            }),
            new SearchedRow({

                name: 'test3',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/GOSH.jpg',
                tel: 'teltest3',
                grade: 'gradetest3',
                specialty: 'specialtytest3',
                postcode: 'postcodetest3',
                operation: null
            }),
            new SearchedRow({

                name: 'test4',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/HEART_Logo.jpg',
                tel: 'teltest4',
                grade: 'gradetest4',
                specialty: 'specialtytest4',
                postcode: 'postcodetest4',
                operation: null
            })
        ]);




        //TODO END

        lm.getCurrentSessionOrNewSession().set("searchedResult", searchedResult);
        var showUserIndex = lm.getCurrentSessionOrNewSession().get("showUserIndex");

        $(this.el).html(this.template({ searchedResult: searchedResult.toJSON(), showUserIndex: showUserIndex }));



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
        
        var currSession = this.model.getCurrentSessionOrNewSession();

        var currIndex = currSession.get("showUserIndex");

        var searchResult = currSession.get("searchedResult");

        var currRow = searchResult.at(currIndex);
        currRow.accept();

        var currIMG = $(".buddy:nth-child(" + (currSession.get("showUserIndex") + 1) + ")");
        currIMG.addClass('rotate-left').delay(700).fadeOut(1);
        $('.buddy').find('.status').remove();

        this.model.penddingStampOnImg(currIMG, LocumOperationType.Accepted);

        var nextIMG = null;
        var nextRowIndex = 0;

        if (currIMG.is('.buddy:last')) {

            nextIMG = $('.buddy:nth-child(1)');
        } else {
            nextIMG = currIMG.next()
            nextRowIndex = currIndex + 1;
        }

        var nextRow = searchResult.at(nextRowIndex);
        currSession.set("showUserIndex", nextRowIndex);

        nextIMG.removeClass('rotate-left rotate-right').delay(700).fadeIn(300);
        this.model.penddingStampOnImg(nextIMG, nextRow.get("operation"));
        

    },
    denyUser: function (e) {

        var currSession = this.model.getCurrentSessionOrNewSession();

        var currIndex = currSession.get("showUserIndex");

        var searchResult = currSession.get("searchedResult");

        var currRow = searchResult.at(currIndex);
        currRow.deny();

        var currIMG = $(".buddy:nth-child(" + (currSession.get("showUserIndex") + 1) + ")");
        currIMG.addClass('rotate-right').delay(700).fadeOut(1);
        $('.buddy').find('.status').remove();

        this.model.penddingStampOnImg(currIMG, LocumOperationType.Denied);

        var nextIMG = null;
        var nextRowIndex = 0;

        if (currIMG.is('.buddy:last')) {

            nextIMG = $('.buddy:nth-child(1)');
        } else {
            nextIMG = currIMG.next()
            nextRowIndex = currIndex + 1;
        }

        var nextRow = searchResult.at(nextRowIndex);
        currSession.set("showUserIndex", nextRowIndex);

        nextIMG.removeClass('rotate-left rotate-right').delay(700).fadeIn(300);
        this.model.penddingStampOnImg(nextIMG, nextRow.get("operation"));
    }
});
