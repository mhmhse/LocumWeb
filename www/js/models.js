//## Issues:
//## - QuestionBank and Session stores the answers. This is because I wasn't sure if a user would ever be able to answer a question
//##   more than once, i.e. a 2nd attempt. Currently this isn't the case, so we could get rid of Session.answers


QuestionTypes = {
    BestOfFive: 'bof',
    NOM: 'nom',
    MCQ: 'mcq',
    EMQ: 'emq',
    SJQ: 'sjq',
	SJT: 'sjt'
};


//## ----------------- MODELS
QuestionBase = Backbone.Model.extend({
    defaults: {
        id: null,
        type: 'base',
        text: null,
        comment: null,
        options: null,
        lastAnswer: null
    },
    
    clearAnswer: function () {
        this.set('lastAnswer', null);
    },

    isAnswered: function () {
        return this.get('lastAnswer') != null;
    }
});


//## N of Many question type - used when n > 1
NOM = QuestionBase.extend({
    defaults: _.extend({
        numberOfOptions: 0,
        selectAllThatApply: false
    }, QuestionBase.prototype.defaults),

    initialize: function (data) {
        //## Override question type
        this.set('type', QuestionTypes.NOM);

        if (!_.isUndefined(data)) {
            if (!_.isUndefined(data.options) && _.isUndefined(data.options._byId))	//## It's just an array, so convert to a QuestionOptions collection
                this.set('options', new QuestionOptions(data.options));

            if (!_.isUndefined(data.lastAnswer) && !_.isNull(data.lastAnswer) && _.isUndefined(data.lastAnswer._byId))
                this.set('lastAnswer', new NOMUserAnswer(data.lastAnswer));
        }
    },

    answerQuestion: function (answers) {
        if (answers == null || answers.length < 1) {
            appLib.alert('Error: NOM with no answers!');
            return;
        }

        var score = this._calculateScore(answers);

        this.set('lastAnswer', new NOMUserAnswer({
            questionId: this.get('id'),
            answers: answers,
            score: score
        }));

        //## Save the user's answer 
        oe.currentSession().get('answers').add(this.get('lastAnswer'));

        //## Show the answer
        app.trigger('questionAnswered');
    },


    //## Calculates the answer score
    _calculateScore: function (answers) {
        var options = this.get('options');
        var score = 0;

        options.each(function (option) {
            if (option.get('score') == 100) {
                //## Did the user select this correct option?
                var selected = _.find(answers, function (answer) {
                    return (option.get('id') == answer);
                });

                if (selected != null)
                    score++;
            }
        });

        var numCorrectOptions = this.get('numberOfOptions');

        //## Were too many options selected?
        if (answers.length > numCorrectOptions) {
            score = score - (answers.length - numCorrectOptions);

            if (score < 0)
                score = 0;
        }

        return (score * 100) / numCorrectOptions;
    }
});


//## Best of Five question type - actually NoM where n = 1
BestOfFive = QuestionBase.extend({
    /*
    defaults: _.extend({
    type: 'bof'
    }, QuestionBase.prototype.defaults),
    */

    initialize: function (data) {
        //## Override question type
        this.set('type', QuestionTypes.BestOfFive);

        if (!_.isUndefined(data)) {
            if (!_.isUndefined(data.options) && _.isUndefined(data.options._byId))	//## It's just an array, so convert to a QuestionOptions collection
                this.set('options', new QuestionOptions(data.options));

            if (!_.isUndefined(data.lastAnswer) && !_.isNull(data.lastAnswer) && _.isUndefined(data.lastAnswer._byId))
                this.set('lastAnswer', new UserAnswer(data.lastAnswer));
        }
    },
    

    answerQuestion: function (answerId) {
        var answer = this.get('options').where({ id: answerId });

        if (answer.length != 1) {
            appLib.alert('Please select one option.');
            return;
        }
        
        this.set('lastAnswer', new UserAnswer({
            questionId: this.get('id'),
            answerId: answerId,
            score: answer[0].get('score')
        }));

        //## Save the user's answer 
        oe.currentSession().get('answers').add(this.get('lastAnswer'));

        //## Show the answer
        app.trigger('questionAnswered');
    }
});


//## Multiple Choice Question (MCQ) type
MCQ = QuestionBase.extend({
    initialize: function (data) {
        //## Override question type
        this.set('type', QuestionTypes.MCQ);

        if (!_.isUndefined(data)) {
            if (!_.isUndefined(data.options) && _.isUndefined(data.options._byId))	//## It's just an array, so convert to a QuestionOptions collection
                this.set('options', new QuestionOptions(data.options));

            if (!_.isUndefined(data.lastAnswer) && !_.isNull(data.lastAnswer) && _.isUndefined(data.lastAnswer._byId))
                this.set('lastAnswer', new MCQUserAnswer(data.lastAnswer));
        }
    },

    answerQuestion: function (answers) {
        if (answers == null || answers.length < 1) {
            appLib.alert('Error: MCQ with no answers!');
            return;
        }

        var score = this._calculateScore(answers);

        this.set('lastAnswer', new MCQUserAnswer({
            questionId: this.get('id'),
            answers: answers,
            score: score
        }));

        //## Save the user's answer 
        oe.currentSession().get('answers').add(this.get('lastAnswer'));

        //## Show the answer
        app.trigger('questionAnswered');
    },


    //## Calculates the answer score
    _calculateScore: function (answers) {
        var options = this.get('options');
        var score = 0;

        options.each(function (option) {
            var currentAnswer = _.find(answers, function (answer) {
                return (option.get('id') == answer.id);
            });

            if (currentAnswer != null && currentAnswer.value == option.get('answer'))
                score++;
        });

        return (score * 100) / options.length;
    }

});


//## Extended Matching Question (EMQ) type
EMQ = QuestionBase.extend({
    defaults: _.extend({
        //## Choice list repeated for each question stem - collection of EMQChoice
        choices: null,
        theme: null
    }, QuestionBase.prototype.defaults),

    initialize: function (data) {
        //## Override question type
        this.set('type', QuestionTypes.EMQ);

        if (!_.isUndefined(data)) {
            if (!_.isUndefined(data.options) && _.isUndefined(data.options._byId))	//## It's just an array, so convert to a QuestionOptions collection
                this.set('options', new QuestionOptions(data.options));

            if (!_.isUndefined(data.lastAnswer) && !_.isNull(data.lastAnswer) && _.isUndefined(data.lastAnswer._byId))
                this.set('lastAnswer', new EMQUserAnswer(data.lastAnswer));

            //## Process choices
            if (!_.isUndefined(data.choices) && _.isUndefined(data.choices._byId))	//## It's just an array, so convert to a EMQChoices collection
                this.set('choices', new EMQChoices(data.choices));
        }
    },

    answerQuestion: function (answers) {
        if (answers == null || answers.length < 1) {
            appLib.alert('Error: EMQ with no answers!');
            return;
        }

		answers = this._processAdditionalAnswers(answers);
        var score = this._calculateScore(answers);

        this.set('lastAnswer', new EMQUserAnswer({
            questionId: this.get('id'),
            answers: answers,
            score: score
        }));

        //## Save the user's answer 
        oe.currentSession().get('answers').add(this.get('lastAnswer'));

        //## Show the answer
        app.trigger('questionAnswered');
    },


	//## Calculate score of lastAnswer as a %
	_calculateScore: function (answers) {        
        var stems = this.get('options');

        var score = 0;

        stems.each(function (stem) {
            //## Get the answer for this stem
            var userAnswer = _.find(answers, function (answer) {
                return (answer.itemId == stem.get('id'));
            });

            if (userAnswer != null && userAnswer.answerOptionId == stem.get('answerId'))
                score++;
        });

        return (score * 100) / stems.length;
    },
	
	
    //## Swap answers (if required) when additional answers are present
    _processAdditionalAnswers: function (answers) {        
        var stems = this.get('options');
		
		var firstAdditionalAnswer = stems.find(function (stem) {
			return (stem.get('text') == oeConstants.emqAdditionalAnswer);
		});
				
		if (firstAdditionalAnswer == null) {		
			//## Additional answer EMQs must contain the keyword '{{AdditionalAnswer}}'
			return answers;
		}
		
				
		for(var i = 0; i < stems.length - 1; i++) {
			var firstStem = stems.at(i);
			var secondStem = stems.at(i + 1);
		
			if(secondStem.get('text') != oeConstants.emqAdditionalAnswer)
				continue;
		
			//## Get the answer for first stem
			var firstStemUserAnswer = _.find(answers, function (answer) {
				return (answer.itemId == firstStem.get('id'));
			});
			
			//## Get the answer for second stem
			var secondStemUserAnswer = _.find(answers, function (answer) {
				return (answer.itemId == secondStem.get('id'));
			});
			
			var isFirstStemCorrect = (firstStemUserAnswer != null && firstStemUserAnswer.answerOptionId == firstStem.get('answerId'));
			var isSecondStemCorrect = (secondStemUserAnswer != null && secondStemUserAnswer.answerOptionId == secondStem.get('answerId'));
			
			if(!isFirstStemCorrect && !isSecondStemCorrect) {
				//## Both answers are incorrect so try swapping answers to see if this results in any correct answers
				isFirstStemCorrect = (firstStemUserAnswer != null && firstStemUserAnswer.answerOptionId == secondStem.get('answerId'));
				isSecondStemCorrect = (secondStemUserAnswer != null && secondStemUserAnswer.answerOptionId == firstStem.get('answerId'));
				
				if(isFirstStemCorrect || isSecondStemCorrect) {
					//## Swap answers as this resulted in a score
					var buffer = firstStemUserAnswer.answerOptionId;
					firstStemUserAnswer.answerOptionId = secondStemUserAnswer.answerOptionId;
					secondStemUserAnswer.answerOptionId = buffer;
				}
			}
		}			
		
		return answers;
    }
});


//## Situational Judgement Question (SJQ) type
SJQ = QuestionBase.extend({
    initialize: function (data) {
        //## Override question type
        this.set('type', QuestionTypes.SJQ);

        if (!_.isUndefined(data)) {
            if (!_.isUndefined(data.options) && _.isUndefined(data.options._byId))	//## It's just an array, so convert to a QuestionOptions collection
                this.set('options', new QuestionOptions(data.options));

            if (!_.isUndefined(data.lastAnswer) && !_.isNull(data.lastAnswer) && _.isUndefined(data.lastAnswer._byId))
                this.set('lastAnswer', new SJQUserAnswer(data.lastAnswer));
        }
    },

    answerQuestion: function (answers) {
        if (answers == null || answers.length < 1) {
            appLib.alert('Error: SJQ with no answers!');
            return;
        }

        var score = this._calculateScore(answers);

        this.set('lastAnswer', new SJQUserAnswer({
            questionId: this.get('id'),
            answers: answers,
            score: score
        }));

        //## Save the user's answer 
        oe.currentSession().get('answers').add(this.get('lastAnswer'));

        //## Show the answer
        app.trigger('questionAnswered');
    },


    //## Calculate score of lastAnswer as a %
    _calculateScore: function (answers) {
        var options = this.get('options');
        var difference = 0;

        options.each(function (option) {
            var currentAnswer = _.find(answers, function (answer) {
                return (option.get('id') == answer.id);
            });

            if (currentAnswer != null) {
                difference += Math.pow(option.get('rank') - currentAnswer.rank, 2);
            }
        });

        var score = 6 * difference;
        var fltDenominator = options.length * (Math.pow(options.length, 2) - 1);

        if (score <= fltDenominator) {
            //## Quick function to round to 2dp
            var roundTo2dp = function(num) { return Math.round(num * 100) / 100; }

            score = score / fltDenominator;
            score = roundTo2dp(1 - score);
        } else {
            score = 0;
        }

        return score * 100;
    }
});


//## Situational Judgement Test (SJT) Foundation Trainees type
SJT = QuestionBase.extend({
    initialize: function (data) {
        //## Override question type
        this.set('type', QuestionTypes.SJT);

        if (!_.isUndefined(data)) {
            if (!_.isUndefined(data.options) && _.isUndefined(data.options._byId))	//## It's just an array, so convert to a QuestionOptions collection
                this.set('options', new QuestionOptions(data.options));

            if (!_.isUndefined(data.lastAnswer) && !_.isNull(data.lastAnswer) && _.isUndefined(data.lastAnswer._byId))
                this.set('lastAnswer', new SJTUserAnswer(data.lastAnswer));
        }
    },

    answerQuestion: function (answers) {
        if (answers == null || answers.length < 1) {
            appLib.alert('Error: SJT with no answers!');
            return;
        }

        var score = this._calculateScore(answers);

        this.set('lastAnswer', new SJTUserAnswer({
            questionId: this.get('id'),
            answers: answers,
            score: score
        }));

        //## Save the user's answer 
        oe.currentSession().get('answers').add(this.get('lastAnswer'));

        //## Show the answer
        app.trigger('questionAnswered');
    },


    //## Calculate score of lastAnswer as a %
    _calculateScore: function (answers) {
        var options = this.get('options');
        var distance = 0;

        options.each(function (option) {
            var currentAnswer = _.find(answers, function (answer) {
                return (option.get('id') == answer.id);
            });

            if (currentAnswer != null) {
				//## How far away is the user's rank from the correct rank?
				distance += Math.abs(option.get('rank') - currentAnswer.rank);                
            }
        });

        var score = (20 - distance) * 5;
        
		if(score < 0)
			score = 0;

        return score;
    }
});




//## Collection of questions
QuestionBank = Backbone.Collection.extend({
    model: QuestionBase,

    initialize: function (data) {
        if (!_.isUndefined(data) && data != null && data.length > 0 && _.isUndefined(data[0].get)) {
            //## Provided data items are plain objects so convert to required models
            for (var i = 0; i < data.length; i++) {
                if (data[i].type == QuestionTypes.BestOfFive)
                    data[i] = new BestOfFive(data[i]);
                else if (data[i].type == QuestionTypes.NOM)
                    data[i] = new NOM(data[i]);
                else if (data[i].type == QuestionTypes.MCQ)
                    data[i] = new MCQ(data[i]);
                else if (data[i].type == QuestionTypes.EMQ)
                    data[i] = new EMQ(data[i]);
                else if (data[i].type == QuestionTypes.SJQ)
                    data[i] = new SJQ(data[i]);
				else if (data[i].type == QuestionTypes.SJT)
                    data[i] = new SJT(data[i]);
            }
        }
    }
});





//========================================================================================

AnswerItemTypes = {
    BestOfFive: 'base',
    MCQ: 'mcq',
    EMQ: 'emq',
    SJQ: 'sjq',
    SJT: 'sjt'
};


//## NOTE: This was originally used in v1 of app, so using it as base although some properties are not required
//## (Answer) Option for a question
QuestionOption = Backbone.Model.extend({
    defaults: {
        //## Id of the option
		id: null,
		text: null,
		comment: null,
		score: 0,

        type: 'base'
	}
});

MCQOption = QuestionOption.extend({    
    defaults: _.extend({
        answerText: null,
        //## True or false
        answer: null
    }, QuestionOption.prototype.defaults),

    initialize: function () {
        this.set('type', AnswerItemTypes.MCQ)
    }
});

EMQOption = QuestionOption.extend({
    defaults: _.extend({        
        //## Id of the answer
        answerId: null        
    }, QuestionOption.prototype.defaults),

    initialize: function () {
        this.set('type', AnswerItemTypes.EMQ)
    }
});

SJQOption = QuestionOption.extend({
    defaults: _.extend({
        //## Rank of the answer
        rank: null
    }, QuestionOption.prototype.defaults),

    initialize: function () {
        this.set('type', AnswerItemTypes.SJQ)
    }
});

SJTOption = QuestionOption.extend({
    defaults: _.extend({
        //## Rank of the answer
        rank: null
    }, QuestionOption.prototype.defaults),

    initialize: function () {
        this.set('type', AnswerItemTypes.SJT)
    }
});


//## Collection of question options
QuestionOptions = Backbone.Collection.extend({
    model: QuestionOption,

    initialize: function (data) {
        if (!_.isUndefined(data) && data != null && data.length > 0 && _.isUndefined(data[0].get)) {
            //## Provided data items are plain objects so convert to required models
            for (var i = 0; i < data.length; i++) {
                //## v1 app questions did not have a type
                if (_.isUndefined(data[i].type) || data[i].type == AnswerItemTypes.BestOfFive)
                    data[i] = new QuestionOption(data[i]);
                else if (data[i].type == AnswerItemTypes.MCQ)
                    data[i] = new MCQOption(data[i]);
                else if (data[i].type == AnswerItemTypes.EMQ)
                    data[i] = new EMQOption(data[i]);
                else if (data[i].type == AnswerItemTypes.SJQ)
                    data[i] = new SJQOption(data[i]);
				else if (data[i].type == AnswerItemTypes.SJT)
                    data[i] = new SJTOption(data[i]);
            }
        }
    }
});


//========================================================================================

//## Holds choices for the EMQ drop down list
EMQChoice = Backbone.Model.extend({
    defaults: {
        type: 'emq',

        id: null,
        comment: null,
        score: null,
        text: null
    }
});

EMQChoices = Backbone.Collection.extend({
    model: EMQChoice,

    initialize: function (data) {
        if (!_.isUndefined(data) && data != null && data.length > 0 && _.isUndefined(data[0].get)) {
            //## Provided data items are plain objects so convert to required models
            for (var i = 0; i < data.length; i++) {                
                if (data[i].type == 'emq')
                    data[i] = new EMQChoice(data[i]);
            }
        }
    }
});


//========================================================================================

UserAnswerTypes = {
    BestOfFive: 'bof',
    NOM: 'nom',
    MCQ: 'mcq',
    EMQ: 'emq',
    SJQ: 'sjq',
	SJT: 'sjt'
};

//## User's answer
UserAnswer = Backbone.Model.extend({
    defaults: {
        questionId: null,
        answerId: null,
        answeredAt: null,
        userId: null,
        score: 0,
        uploaded: false,

        type: UserAnswerTypes.BestOfFive
    },

    isCorrect: function () {
        return (this.get('score') == 100);
    },

    getUserAnswerDTO: function () {
        var dto = {
            __type: 'DABL.GenericAssessment.DTO.Questions.UserAnswerDTO',
            Qid: this.get('questionId'),
            StemAnswers: this._getStemAnswersDTO()
        };

        return dto;
    },

    //## Current system defaults to NOM
    _getStemAnswersDTO: function () {
        var answers = [];
        answers.push({
            __type: 'DABL.GenericAssessment.DTO.Questions.NOMUserStemAnswerDTO',
            AnswerOptionId: this.get('answerId')
        });

        return answers;
    }
});


NOMUserAnswer = UserAnswer.extend({
    defaults: _.extend({
        //## array of AnswerIds
        answers: null
    }, UserAnswer.prototype.defaults),

    initialize: function () {
        this.set('type', UserAnswerTypes.NOM)
    },

    _getStemAnswersDTO: function () {
        var myAnswers = [];

        _.each(this.get('answers'), function (answer, index, list) {
            myAnswers.push({
                __type: 'DABL.GenericAssessment.DTO.Questions.NOMUserStemAnswerDTO',
                AnswerOptionId: answer
            });
        });

        return myAnswers;
    }
});


MCQUserAnswer = UserAnswer.extend({
    defaults: _.extend({
        //## array of type: { id: 1, value: false }
        answers: null
    }, UserAnswer.prototype.defaults),
    
    initialize: function () {
        this.set('type', UserAnswerTypes.MCQ)
    },

    _getStemAnswersDTO: function () {
        var myAnswers = [];

        _.each(this.get('answers'), function (answer, index, list) {
            myAnswers.push({
                __type: 'DABL.GenericAssessment.DTO.Questions.MCQUserQuestionAnswerDTO',
                AnswerItemId: parseInt(answer.id, 10),
                Answer: answer.value
            });
        });

        return myAnswers;
    }
});



EMQUserAnswer = UserAnswer.extend({
    defaults: _.extend({
        //## array of type: { itemId: 123, answerOptionId: 777 }
        answers: null
    }, UserAnswer.prototype.defaults),

    initialize: function () {
        this.set('type', UserAnswerTypes.EMQ)
    },

    _getStemAnswersDTO: function () {
        var myAnswers = [];

        _.each(this.get('answers'), function (answer, index, list) {
            myAnswers.push({
                __type: 'DABL.GenericAssessment.DTO.Questions.EMQUserQuestionAnswerDTO',
                ItemId: answer.itemId,
                AnswerOptionId: answer.answerOptionId
            });
        });

        return myAnswers;
    }
});


SJQUserAnswer = UserAnswer.extend({
    defaults: _.extend({
        //## array of type: { answerItemId: 123, rank: 2 }
        answers: null
    }, UserAnswer.prototype.defaults),

    initialize: function () {
        this.set('type', UserAnswerTypes.SJQ)
    },

    _getStemAnswersDTO: function () {
        var myAnswers = [];

        _.each(this.get('answers'), function (answer, index, list) {
            myAnswers.push({
                __type: 'DABL.GenericAssessment.DTO.Questions.SJQUserQuestionAnswerDTO',
                AnswerItemId: answer.id,
                Rank: answer.rank
            });
        });

        return myAnswers;
    }
});


//## Same as SJQUserAnswer but marked up for a different .NET type
SJTUserAnswer = UserAnswer.extend({
    defaults: _.extend({
        //## array of type: { answerItemId: 123, rank: 2 }
        answers: null
    }, UserAnswer.prototype.defaults),

    initialize: function () {
        this.set('type', UserAnswerTypes.SJT)
    },

    _getStemAnswersDTO: function () {
        var myAnswers = [];

        _.each(this.get('answers'), function (answer, index, list) {
            myAnswers.push({
                __type: 'DABL.GenericAssessment.DTO.Questions.SJTUserQuestionAnswerDTO',
                AnswerItemId: answer.id,
                Rank: answer.rank
            });
        });

        return myAnswers;
    }
});




//## Collection of user answers
UserAnswers = Backbone.Collection.extend({ 
	model: UserAnswer,

    initialize: function (data) {
        if (!_.isUndefined(data) && data != null && data.length > 0 && _.isUndefined(data[0].get)) {
            //## Provided data items are plain objects so convert to required models
            for (var i = 0; i < data.length; i++) {                
                if (_.isUndefined(data[i].type) || data[i].type == UserAnswerTypes.BestOfFive)
                    data[i] = new UserAnswer(data[i]);
                else if (data[i].type == UserAnswerTypes.NOM)
                    data[i] = new NOMUserAnswer(data[i]);
                else if (data[i].type == UserAnswerTypes.MCQ)
                    data[i] = new MCQUserAnswer(data[i]);
                else if (data[i].type == UserAnswerTypes.EMQ)
                    data[i] = new EMQUserAnswer(data[i]);
                else if (data[i].type == UserAnswerTypes.SJQ)
                    data[i] = new SJQUserAnswer(data[i]);
            }
        }
    }
});


//========================================================================================

//## Session
Session = Backbone.Model.extend({
    defaults: {
        answers: null,
        completed: false,

        questionIndex: 0,
        numQuestions: 0,

        showAnswer: true,
        showTimer: false,

        examId: null
    },

    initialize: function (data) {
        if (_.isUndefined(data) || _.isUndefined(data.answers))
            this.set('answers', new UserAnswers());
        else
            this.set('answers', new UserAnswers(data.answers));
    },


    allQuestionsAnswered: function () {
        return this.questionsAnswered() == this.get('numQuestions');
    },

    questionsAnswered: function () {
        return this.get('answers').length;
    },


    //## 100% answers
    correctAnswers: function () {
        var count = 0;

        this.get('answers').each(function (answer) {
            if (answer.isCorrect())
                count++;
        });

        return count;
    },

    //## 0% answers
    wrongAnswers: function () {
        var count = 0;

        this.get('answers').each(function (answer) {
            if (answer.get('score') == 0)
                count++;
        });

        return count;
    },

    hasAnswersToUpload: function () {
        return this.get('answers').where({ uploaded: false }).length > 0;
    },

    isCompleted: function () {
        return this.get('completed');
    },

    //## score as a %
    score: function () {
        var score = 0;

        this.get('answers').each(function (answer) {
            score += answer.get('score');
        });

        return score / this.get('answers').length;
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
		userId: null
	},
	
	reset: function() {
		this.set('email', null);
		this.set('key', null);
		this.set('userId', null);
	},

	uploadAnswers: function() {
		return this.get('email') != null;
	}
});
