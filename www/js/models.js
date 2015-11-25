//## Issues:
//## - QuestionBank and Session stores the answers. This is because I wasn't sure if a user would ever be able to answer a question
//##   more than once, i.e. a 2nd attempt. Currently this isn't the case, so we could get rid of Session.answers

//## Issues:
//## - QuestionBank and Session stores the answers. This is because I wasn't sure if a user would ever be able to answer a question
//##   more than once, i.e. a 2nd attempt. Currently this isn't the case, so we could get rid of Session.answers

UserTypes = {

    Doctor: 'doctor',
    Hospital: 'hospital'
};

UserBase = Backbone.Model.extend({
    defaults: {
        id: null,
        type: 'base',
        name: null,
        email: null,
        password: null
    }
});

DoctorUser = UserBase.extend({

    initialize: function (data) {
        this.set('type', UserTypes.Doctor);
    }
});

HospitalUser = UserBase.extend({

    initialize: function (data) {
        this.set('type', UserTypes.Hospital);
    }
});


UserBaseBank = Backbone.Collection.extend({
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
Grade = Backbone.Model.extend({

    id: 0,
    simpleName: '',
    fullName: ''
});

Grades = Backbone.Collection.extend({
    model: Grade,
    initialize: function (data) {


    }
});

var grades = new Grades([

    new Grade({
        id: 0,
        simpleName: 'FY2',
        fullName: 'Foundation Year 2'
    }),
    new Grade({
        id: 1,
        simpleName: 'Registrar',
        fullName: 'Registrar'
    }),
    new Grade({
        id: 2,
        simpleName: 'Consultant',
        fullName: 'Consultant'
    })

]);

//========================================================================================

//## Specialty
Speciality = Backbone.Model.extend({

    id: 0,
    simpleName: '',
    fullName: ''
});

Specialities = Backbone.Collection.extend({
    model: Grade,
    initialize: function (data) {


    }
});

var specialities = new Specialities([

    new Speciality({
        id: 0,
        simpleName: 'Cardiology',
        fullName: 'Cardiology Year 2'
    }),
    new Speciality({
        id: 1,
        simpleName: 'Respiratory',
        fullName: 'Respiratory'
    }),
    new Speciality({
        id: 2,
        simpleName: 'Geriatrics',
        fullName: 'Geriatrics'
    }),
	new Speciality({
        id: 3,
        simpleName: 'Neurology',
        fullName: 'Neurology'
    }),
	new Speciality({
        id: 4,
        simpleName: 'Pediatrics',
        fullName: 'Pediatrics'
    }),
	new Speciality({
        id: 5,
        simpleName: 'Oncology',
        fullName: 'Oncology'
    })

]);


//========================================================================================


LocumOperationType = {

    NoOperation: "",
    Accepted: "ACCEPTED",
    Denied: "DENIED"
}

//## SearchResult

SearchedRow = Backbone.Model.extend({
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

SearchedResult = Backbone.Collection.extend({
    model: SearchedRow,
    initialize: function (data) {

        if (!_.isUndefined(data) && data != null) {

            data.operation = LocumOperationType.NoOperation;
        }
    }
});


//========================================================================================

//## SearchCondition
SearchParameters = Backbone.Model.extend({

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

//========================================================================================

//## Session
Session = Backbone.Model.extend({
    defaults: {

        searchParameter: null,
        showUserIndex: 0,
        searchedResult: null
    },

    initialize: function (data) {
        searchParameter = new SearchParameters();
        searchedResult = new SearchedResult();
        showUserIndex = 0;
    }
});

Sessions = Backbone.Collection.extend({
	model: Session
});


//========================================================================================

//## Authorisation data
Auth = Backbone.Model.extend({
	defaults: {		
		email: null,
		key: null,
		userDetails: null
	},
	
	reset: function() {
		this.set('email', null);
		this.set('key', null);
		this.set('userDetails', null);
	}
});
