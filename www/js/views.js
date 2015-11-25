//## ----------------- VIEWS

//## Home
var HomeView = Backbone.View.extend({


    template: _.template($('#HomeTemplate').html()),

    render: function (eventName) {


		var hideContinueSession = _.isUndefined(this.model) || this.model == null;		
		var continueSessionButtonStyle = (hideContinueSession ? 'display:none;' : '');


		var loginStyle = (lm.auth.get('email') ? 'display:none;' : '');

		searchPath = '';
		if (lm.auth.get('userDetails').get('type') == UserTypes.Doctor) {
            
		    searchPath = 'SearchForHospital';
		} else {

		    searchPath = 'SearchForDoctor';
		}
		
		var usertype = lm.auth.get('userDetails').get('type');
		var html = this.template({ buttonStyle: loginStyle, searchPath: searchPath, usertype:usertype });
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

				            var locumRole = data.userRole

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

//## Settings	
var ProfileView = Backbone.View.extend({
    template: _.template($('#ProfileTemplate').html()),

    render: function (eventName) {

		var usertype = lm.auth.get('userDetails').get('type');
        $(this.el).html(this.template({ email: lm.auth.get('email'), usertype:usertype }));
        return this;
    },


    events: {
        "click #save": "save"
    },

    save: function () {

        app.trigger("home");
    }
});


//========================================================================================


//## Getting Started	
var GettingStartedView = Backbone.View.extend({
	
    template: _.template($('#GettingStartedTemplate').html()),

	
    render: function (eventName) {
	
		var usertype = lm.auth.get('userDetails').get('type');
        $(this.el).html(this.template({usertype:usertype}));

        return this;
    }

});

//========================================================================================

//## Search For Hospital
var SearchForHospitalView = Backbone.View.extend({
    template: _.template($('#SearchForHospitalTemplate').html()),

    render: function (eventName) {
	
		var usertype = lm.auth.get('userDetails').get('type');
        //## Get the user's exams
        $(this.el).html(this.template({ specialities: specialities.toJSON(), grades: grades.toJSON(), usertype:usertype }));
        
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


//## Saved list
var SavedListView = Backbone.View.extend({
    template: _.template($('#SavedListTemplate').html()),

    render: function (eventName) {

		var usertype = lm.auth.get('userDetails').get('type');
        var searchedResult = lm.getCurrentSessionOrNewSession().get("searchedResult");
        
        if (searchedResult != null) {

            var savedResult = searchedResult.filter(function (item) {

                return item.get("operation") == LocumOperationType.Accepted;
            });

            $(this.el).html(this.template({ savedResult: new SearchedResult(savedResult).toJSON(), usertype:usertype }));
            
        } else {

            $(this.el).html(this.template({ savedResult: null, usertype:usertype }));
        }

        
        

        return this;
    },

    events: {
        "click #viewMatcher": "viewMatcher"
    },

    viewMatcher: function () {

        app.trigger('matcher');
    }
});

//========================================================================================

//========================================================================================

//## Search For Doctor
var SearchForDoctorView = Backbone.View.extend({
    template: _.template($('#SearchForDoctorTemplate').html()),

    render: function (eventName) {
        //## Get the user's exams
        $(this.el).html(this.template({ specialities: specialities.toJSON(), grades: grades.toJSON() }));

        return this;
    },

    events: {
        "click #searchDoctor": "searchDoctor"
    },

    searchDoctor: function () {

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


        app.trigger('SearchDoctorResult',
            searchParameter
        );
    }
});




//========================================================================================

//## Saved list
var MatcherView = Backbone.View.extend({
    template: _.template($('#MatcherTemplate').html()),

    render: function (eventName) {

        var searchedResult = lm.getCurrentSessionOrNewSession().get("searchedResult");
		
		var usertype = lm.auth.get('userDetails').get('type');
		

        if (searchedResult != null) {

            var savedResult = searchedResult.filter(function (item) {

                return item.get("operation") == LocumOperationType.Accepted;
            });

            $(this.el).html(this.template({ savedResult: new SearchedResult(savedResult).toJSON(), usertype:usertype }));

        } else {

            $(this.el).html(this.template({ savedResult: null }));
        }




        return this;
    },

    events: {
        "click #viewMatcher": "viewMatcher"
    },

    viewMatcher: function () {

        app.trigger('matcher');
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

                name: 'Birmingham Children\'s Hospital',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/BCH.jpg',
                tel: '0121 333 9999',
                grade: 'registrar',
                specialty: 'paediatrics',
                postcode: 'B4 6NH',
                operation: null
            }),
            new SearchedRow({

                name: 'Birmingham Womens Hospital',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/BWH.jpg',
                tel: '0121 472 1377',
                grade: 'registrar',
                specialty: 'geriatrics',
                postcode: 'B15 2TG',
                operation: null
            }),
            new SearchedRow({

                name: 'Great Ormond Street Hospital',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/GOSH.jpg',
                tel: '020 7405 9200',
                grade: 'consultant',
                specialty: 'paediatrics',
                postcode: 'WC1N 3JH',
                operation: null
            }),
            new SearchedRow({

                name: 'Heart of England NHS Trust',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/hospitals/HEART_Logo.jpg',
                tel: '0121 424 2000',
                grade: 'consultant',
                specialty: 'geriatrics',
                postcode: 'B9 5SS',
                operation: null
            })
        ]);




        //TODO END

        lm.getCurrentSessionOrNewSession().set("searchedResult", searchedResult);
        var showUserIndex = lm.getCurrentSessionOrNewSession().get("showUserIndex");
		var usertype = lm.auth.get('userDetails').get('type');
        $(this.el).html(this.template({ searchedResult: searchedResult.toJSON(), showUserIndex: showUserIndex, usertype:usertype }));



        return this;
    },

    events: {
        "click #viewSavedList": "viewSavedList",
        "swipeleft": "denyUser",
        "swiperight": "saveUser",
    },

    viewSavedList: function () {

        app.trigger('SavedList');
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

			app.trigger("SavedList");
			return;
            //nextIMG = $('.buddy:nth-child(1)');
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
			app.trigger("SavedList");
			return;
            //nextIMG = $('.buddy:nth-child(1)');
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

//## Search Doctor Review
var SearchDoctorResultView = Backbone.View.extend({
    template: _.template($('#SearchDoctorResultTemplate').html()),

    render: function (eventName) {

        var searchParameter = lm.getCurrentSessionOrNewSession().get("searchParameter");

        
        //TODO
        //var searchedResult = lm.search(searchParameter);
        var searchedResult = new SearchedResult([

		            new SearchedRow({

                name: 'Adrian Harris',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/doctors/AdrianHarris.jpg',
                tel: '07912345678',
                grade: 'registrar',
                specialty: 'paediatrics',
                postcode: 'B4 6NJ',
                operation: null
            }),
            new SearchedRow({

                name: 'Alex Walkinshaw',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/doctors/AlexWalkinshaw.png',
                tel: '07711345956',
                grade: 'consultant',
                specialty: 'oncology',
                postcode: 'B8 6NH',
                operation: null
            }),
            new SearchedRow({

                name: 'Caroline Webster',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/doctors/CarolineWebster.jpg',
                tel: '07911345956',
                grade: 'registrar',
                specialty: 'neurology',
                postcode: 'B11 9NH',
                operation: null
            }),
        
			new SearchedRow({

                name: 'Ravinder Gill',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/doctors/RavinderGill.jpg',
                tel: '07712096515',
                grade: 'registrar',
                specialty: 'geriatrics',
                postcode: 'B6 8AX',
                operation: null
            }),		
			new SearchedRow({

                name: 'Chris Colquhoun',
                url: 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/img/doctors/ChrisColquhoun.png',
                tel: '07811305956',
                grade: 'foundation_2',
                specialty: 'rheumatology',
                postcode: 'MK11 9NH',
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

        app.trigger('SavedList');
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

		
			app.trigger("SavedList");
			return;
            //nextIMG = $('.buddy:nth-child(1)');
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
			app.trigger("SavedList");
			return;
            //nextIMG = $('.buddy:nth-child(1)');
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
