//## Issues:
//## - QuestionBank and Session stores the answers. This is because I wasn't sure if a user would ever be able to answer a question
//##   more than once, i.e. a 2nd attempt. Currently this isn't the case, so we could get rid of Session.answers

//## Issues:
//## - QuestionBank and Session stores the answers. This is because I wasn't sure if a user would ever be able to answer a question
//##   more than once, i.e. a 2nd attempt. Currently this isn't the case, so we could get rid of Session.answers


//var baseUrl = 'http://pupfish01.internal.bmjgroup.com:8080/locumservice/';
var baseUrl = 'http://localhost:8081/locumservice/';



UserTypes = {

    Doctor: 'doctor',
    Hospital: 'hospital'
};

var UserBase = Backbone.Model.extend({
    defaults: {
        id: null,
        type: 'base',
        name: null,
        email: null,
        password: null
    }
});

var DoctorUser = UserBase.extend({

    initialize: function (data) {
        this.set('type', UserTypes.Doctor);
    }
});

var HospitalUser = UserBase.extend({

    initialize: function (data) {
        this.set('type', UserTypes.Hospital);
    }
});


var UserBaseBank = Backbone.Collection.extend({
    model: UserBase,
    initialize: function (data) {

        if (!_.isUndefined(data) && data != null && data.length > 0 && _.isUndefined(data[0].get)) {

            for (var i = 0; i < data.length; i++) {

                if (data[i].type == UserTypes.Doctor)
                    data[i] = new DoctorUser(data[i]);
                else if (data[i].type == UserTypes.Hospital)
                    data[i] = new HospitalUser(data[i]);
                
            }
        }
    }
});

//========================================================================================

//## Grade
var Grade = Backbone.Model.extend({
	value: ''
});

var Grades = Backbone.Collection.extend({
	url: baseUrl + '/getAllGrades',
    model: Grade,
    success: function(response){
    	console.log(JSON.stringify(response));
    }
});



//========================================================================================

//## Specialty
var Specialty = Backbone.Model.extend({
	value: ''
});

var Specialties = Backbone.Collection.extend({
	url: baseUrl + '/getAllSpecialties',
    model: Specialty,
    success: function(response){
    	console.log(JSON.stringify(response));
    }
});



//========================================================================================


LocumOperationType = {

    NoOperation: "",
    Accepted: "ACCEPTED",
    Denied: "DENIED"
}

//## SearchResult

var SearchedRow = Backbone.Model.extend({
    url: '/search',
    defaults: {
        name: '',
        url: '',
        tel: '',
        grade: null,
        specialty: null,
        postcode: '',
        operation: null
    },

    initialize: function (data) {


    },

    accept: function () {


        this.set("operation", LocumOperationType.Accepted);

    },

    deny: function (data) {


        this.set("operation", LocumOperationType.Denied);
    }
});

var SearchedResult = Backbone.Collection.extend({
    model: SearchedRow,
    initialize: function (data) {

        if (!_.isUndefined(data) && data != null) {

            data.operation = LocumOperationType.NoOperation;
        }
    }
});


//========================================================================================

//## SearchCondition
var SearchParameters = Backbone.Model.extend({

    defaults: {
        searchType:null,
        grade: null,
        specialty: null,
        postcode: '',
        range: 10
    },

    initialize: function (data) {

        if (!_.isUndefined(data) && data != null) {

            if (data.grade != null) {

                searchType = data.grade;
            } else {

                searchType = 'ALL';
            }
            
            if (data.grade != null) {

                grade = data.grade;
            } else {

                grade = 'ALL';
            }

            if (data.specialty != null) {

                specialty = data.specialty;
            } else {

                specialty = 'ALL';
            }

            if (data.postcode != null) {

                postcode = data.postcode;
            } else {

                postcode = 'ALL';
            }

            if (data.range != null) {

                range = data.range;
            } else {

                range = 50;
            }
        }
        
    },

    getQueryString: function (data) {

        return "/" + searchType + "/" + grade + "/" + specialty + "/" + postcode + "/" + range;
    }
});

