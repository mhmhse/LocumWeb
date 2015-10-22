$(document).bind("mobileinit", function () {
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;

    //## Remove page from DOM when it's being replaced
    $(document).on('pagehide', 'div[data-role="page"]', function (event, ui) {
        $(event.currentTarget).remove();
    });
	
	$.mobile.loadingMessageTextVisible = true;
                 
    $(document).on('pagechangefailed', function(e, data) {
        appLib.log("-----------> Page change failed");
    });
                 

                 
    //## Popup dialog for question images
    $(document).on('click', '.questionAnswer img, .question img', function() {
        var popup = $('#imagePopup');
        var createPopup = (popup.length == 0);
        
        if (createPopup) {
            //## Add the popup markup to the current page
            $('[data-role=content]').first().append('<div data-role="popup" id="imagePopup" data-overlay-theme="e" class="ui-content"></div>');
            popup = $('#imagePopup');
        } else {
            //## Empty existing popup
            popup.empty();
        }
        
        //## Hacked icon as suggested code below wasn't working
        //popup.append('<a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right">Close</a>');
        //popup.append('<a href="#" data-rel="back" data-role="button" data-theme="a" data-iconpos="notext" class="ui-btn-right ui-icon ui-icon-delete ui-icon-shadow"></a>');
	
		var popupWidth = Math.round(Math.min($(window).width() * 0.8, this.naturalWidth * 2));
		var popupHeight = Math.round(Math.min($(window).height() * 0.8, this.naturalHeight * 2));
		
        popup.append('<div id="imagePopupInner" style="width:' + popupWidth + 'px; max-width:' + Math.round($(window).width() * 0.8) + 'px; height:' + popupHeight + 'px; overflow:auto;"></div><div class="ui-popup-notice">Scrollable image (x2)</div>');
        popup.append('<a href="#" id="imagePopupClose" data-rel="back" data-role="button" data-theme="a" data-iconpos="notext" class="ui-btn-right ui-icon ui-icon-delete ui-icon-shadow"></a>');
		//popup.append('<div class="ui-popup-close"><a href="#" data-rel="back" data-role="button" data-theme="a">Close</a></div><br />');
		
        //## NOTE: Injecting an IFrame (to allow pinch/zoom) doesn't work with phonegap
        //## Add the image to the popup
        
        $('#imagePopupInner').append('<img src="' + $(this).attr('src') + '" style="width:' + (this.naturalWidth * 2) + 'px;" />');
        
                    
        if(createPopup)
            popup.popup({ history: false });
        
        popup.popup('open', { positionTo:'window' });
    });
	
	
	
	//## Popup dialog for in-question menu
    $(document).on('click', '#menuButton', function() {	
        var popup = $('#menuPopup');
        var createPopup = (popup.length == 0);
        
        if (createPopup) {
            //## Add the popup markup to the current page
            $('[data-role=content]').first().append('<div data-role="popup" id="menuPopup" data-overlay-theme="e" class="ui-content"></div>');
            popup = $('#menuPopup');
        } else {
            //## Empty existing popup
            popup.empty();
        }
        	
		var popupWidth = $(window).width() * 0.8;
		var popupHeight = $(window).height() * 0.8;		
        popup.append('<div id="menuPopupInner" style="width:' + popupWidth + 'px; height:' + popupHeight + 'px; overflow:auto;"></div>');
		popup.append('<a href="#" id="menuPopupClose" data-rel="back" data-role="button" data-iconpos="notext" class="ui-btn-right ui-icon ui-icon-delete ui-icon-shadow popNavClose"></a>');
		
        		
		var questionTemplate = _.template($('#QuestionOptionPreviewTemplate').html());		
		var count = 1;
		var html = '';
		var currentQuestionIndex = oe.currentSession().get('questionIndex');
		
		oe.questionBank.each(function (question) {		
			var colour = 'blueBlock';
			
			if(question.isAnswered()) {
				var score = question.get('lastAnswer').get('score');
				if(score == 0)
					colour = 'redBlock';
				else if(score == 100)
					colour = 'greenBlock';
				else
					colour = 'yellowBlock';
			}
			
			if(count - 1 == currentQuestionIndex)
				colour += ' highlighted';
		
			html += questionTemplate({ id: count, colour: colour });        	
			count++;
		});
				
		var template = _.template($('#QuestionPreviewHeaderTemplate').html());
		
		//## Height is based on showing part of some question id "blocks" to give the indication the area can be scrolled
		$('#menuPopupInner').append(template({ 
										questionOptionHtml: html, 
										height: popupHeight - 220,
										questionCount: oe.questionBank.length
									}));						
		
		showQuestionPreview(currentQuestionIndex);
		
        if(createPopup)
            popup.popup({ history: false });
        
        popup.popup('open', { positionTo:'window' });
		
		//## Scroll the current (highlighted) question index into view (question elements start at 1)
		$('#questionPreview' + (currentQuestionIndex + 1))[0].scrollIntoView(true);
	});
	
	
	//## Display the specified question text in the preview area (index is zero based)
	function showQuestionPreview(index) {
		var text = $('<p>' + oe.questionBank.at(index).get('text') + '</p>').text().substr(0, 100);
		if(text.length == 100)
			text += '...';

		//## Only allow session review if a question has been answered
		var reviewButtonStyle = (oe.currentSession().get('answers').length > 0 ? '' : 'display:none;')
		
		var template = _.template($('#QuestionPreviewFooterTemplate').html());
		$('#questionPreview').empty().append(template({ 
			id: index + 1, 
			text: text,
			reviewButtonStyle: reviewButtonStyle
		}));   
		
		//## Convert to jqm buttons
		$('#menuPopupInner button').button();
	};
	
		
	//## Question index links in Popup dialog 
    $(document).on('click', '.questionPreviewBlock', function() {
		
		var text = $(this).text();
		var id = parseInt(text, 10);
		
		showQuestionPreview(id - 1);
		
		//## Highlight only the selected question index
		$('.questionPreviewBlock').removeClass('highlighted');
		$(this).addClass('highlighted');
	});
	
	
	//## Close the popup and display the selected question
	$(document).on('click', '#moveToPreviewQuestionButton', function() {			
		var questionIndex = parseInt(this.value, 10) - 1;
		oe.currentSession().set('questionIndex', questionIndex);
		
		$('#menuPopup').popup('close');
		
		app.trigger('continueQuestions', questionIndex);		
	});

		
	//## Session Review click - confirm via dialog
	$(document).on('click', '#sessionReviewButton', function() {	
		appLib.confirm('Are you sure you want to finish this question session?',
					   function (index) {
					       if (index == 1)
					           app.trigger("viewSessionResults");
					   },
					   'Finish Questions?',
					   'Yes,No');
	});
	
	/*
	//## Android fix for fixed footer issue when select list is under it
	$(document).bind('tap', function(e) {
		console.log(e.target);
		var footerTap = $(e.target).closest("[data-role='footer']").length > 0;
		console.log('footer? ' + footerTap);
	
		if(footerTap)
			e.preventDefault();
	
        //if($(e.target).closest("[data-role='footer']").length > 0 || $(e.target).closest("[data-role='header']").length > 0) {
        //    $('[data-role="content"]').hide();
        //}
	});*/
	
});
