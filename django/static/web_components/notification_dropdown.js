export class NotificationDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open'});
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const styleLink = document.createElement('link');

        styleLink.setAttribute('rel', 'stylesheet');
        styleLink.setAttribute('href', 'static/css/notification_dropdown.css');
        this.shadowRoot.innerHTML = `
        <div ng-app="demoApp" class="ng-app">
		<div class="wrapper" ng-controller="demoController">
		  <div class="nav-bar">
		    <ul>
		      <li class="searchbox-wrapper">
		        <div class="search-box">
		          <span class="fa fa-search search-icon"></span>
		          <input type="text" />
		        </div>
		      </li>
		      <li>
		        <div class="dropdowns-wrapper">
		          <div class="dropdown-container">
		            <div class="notifications dropdown dd-trigger" ng-click="showNotifications($event)">
		              <span class="count animated" id="notifications-count">{{awaitingNotifications}}</span>
		              <span class="fa fa-bell-o"></span>
		            </div>
		            <div class="dropdown-menu animated" id="notification-dropdown">
		              <div class="dropdown-header">
		                <span class="triangle"></span>
		                <span class="heading">Notifications</span>
		                <span class="count" id="dd-notifications-count">{{newNotifications.length}}</span>
		              </div>
		              <div class="dropdown-body">
		                <div class="notification new" ng-repeat="notification in newNotifications.slice().reverse() track by notification.timestamp">
		                  <div class="notification-image-wrapper">
		                  	<div class="notification-image">
			                  	<img src="{{notification.user.imageUrl}}" alt="" width="32">
			                  </div>
		                  </div>
		                  <div class="notification-text">
		                     <span class="highlight">{{notification.user.name}}</span> {{notification.action}} {{notification.target}}
		                  </div>
		                </div>
		                <div class="notification" ng-repeat="notification in readNotifications.slice().reverse() track by $index">
		                  <div class="notification-image-wrapper">
		                  	<div class="notification-image">
			                  	<img src="{{notification.user.imageUrl}}" alt="" width="32">
			                  </div>
		                  </div>
		                  <div class="notification-text">
		                     <span class="highlight">{{notification.user.name}}</span> {{notification.action}} {{notification.target}}
		                  </div>
		                </div>
		              </div>
		            </div>
		          </div>
		          <div class="dropdown-container">
		            <div class="messages dropdown">
		              <span class="fa fa-envelope-o"></span>
		            </div>
		          </div>
		        </div>
		      </li>
		      <li class="user">
		        <div class="user-options-wrapper">
		          <div class="user-image">
		          
		          </div>
		          <div class="user-options">
		            <span class="fa fa-chevron-down"></span>
		          </div>
		        </div>
		      </li>
		    </ul>  
		  </div>
		  <div class="body-image">
		  	<div class="instruction animated">Click on the bell!</div>
		  	<div class="info animated" id="demoInfo">
		  		<ul>
		  			<li>Dummy Polling is called at random intervals ranging from 1s to 5s.</li>
		  			<li>Dropdown shows both read and unread notifications.</li>
		  			<li>Unead notifications have blue background while read notifications have white background.</li>
		  			<li>On closing the dropdown, all notifications are marked as read.</li>
		  			<li>Dropdowns also display new notifications while it is open.</li>
		  			<li>Current status is maintained even on refresh.</li>
  <li>Count on bell is displayed only if it not zero.</li>
		  		</ul>
			  	<div class="ok-btn-wrapper">
			  		<span class="ok-btn" ng-click="hideInfo()">
			  			<span class="text">Okay!</span>
			  			<span class="hover-overlay"></span>
			  		</span>
			  	</div>
		  	</div>
		  </div>
		</div>
	</div>
    <script>
    var app = angular.module('demoApp', ['ngAnimate']);
app.controller('demoController', function($scope){
	var opendd;
	var storedNewNotifications;
	var storedReadNotifications;
	var storedawaitingNotifications;
	var init = function(){
		storedNewNotifications = JSON.parse(localStorage.getItem('newNotifications'));
		storedReadNotifications = JSON.parse(localStorage.getItem('readNotifications'));
		storedawaitingNotifications = JSON.parse(localStorage.getItem('awaitingNotifications'));
		if(storedNewNotifications == null){
			$scope.newNotifications = [
				{
					user: pollingData.users[1],
					action: pollingData.actions[0],
					target: pollingData.actionTargets[2],
					timestamp: new Date()
				}
			];
		}
		else{
			$scope.newNotifications = storedNewNotifications;
		}
		if(storedReadNotifications == null){
			$scope.readNotifications = [
				{
					user: pollingData.users[2],
					action: pollingData.actions[1],
					target: pollingData.actionTargets[0],
					timestamp: new Date()
				}
			];
		}
		else{
			$scope.readNotifications = storedReadNotifications;
		}
		if(storedawaitingNotifications == null)
			$scope.awaitingNotifications = 1;
		else{
			$scope.awaitingNotifications = storedawaitingNotifications;
			if($scope.awaitingNotifications == 0)
				angular.element('#notifications-count').hide();
		}
		$scope.showNotifications = function($event){
			var targetdd = angular.element($event.target).closest('.dropdown-container').find('.dropdown-menu');
			opendd = targetdd;
		    if(targetdd.hasClass('fadeInDown')){
		    	hidedd(targetdd);
		    }
		    else{
		    	targetdd.css('display', 'block').removeClass('fadeOutUp').addClass('fadeInDown')
		    									.on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function(){
	  												angular.element(this).show();
	  											});
          targetdd.find('.dropdown-body')[0].scrollTop = 0;
		    	$scope.awaitingNotifications = 0;
		      	angular.element('#notifications-count').removeClass('fadeIn').addClass('fadeOut');
		    }
		};
		$scope.hideInfo = function(){
			angular.element('#demoInfo').addClass('zoomOut')
										.on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function(){
											angular.element(this).hide();
											angular.element('.instruction').addClass('zoomIn').show();
										});
		}
		//show notifications count if new notifications are received
		setInterval(function(){
			if($scope.awaitingNotifications > 0 && opendd == null && (angular.element('#notifications-count').css('opacity') == '0' || angular.element('#notifications-count').is(':hidden')))
    			angular.element('#notifications-count').removeClass('fadeOut').addClass('fadeIn').show();
		}, 400);
		dummyPolling();
	}

	//Hide dropdown function
	var hidedd = function(targetdd){
		targetdd.removeClass('fadeInDown').addClass('fadeOutUp')
										  .on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function(){
  												angular.element(this).hide();
  											});
    	opendd = null;
    	$scope.awaitingNotifications = 0;
    	angular.forEach($scope.newNotifications, function(notification){
    		$scope.readNotifications.push(notification);
    	});
    	$scope.newNotifications = [];
    	localStorage.setItem('readNotifications', JSON.stringify($scope.readNotifications));
    	localStorage.setItem('newNotifications', JSON.stringify($scope.newNotifications));
		localStorage.setItem('awaitingNotifications', JSON.stringify($scope.awaitingNotifications));
    	if($scope.awaitingNotifications > 0)
    		angular.element('#notifications-count').removeClass('fadeOut').addClass('fadeIn');
	}

	//New notification is created by selecting random user, action and targets from this object
	var pollingData = {
	    users : [
		    {
		        name: "Fauzan Khan",
		        imageUrl: "https://media.licdn.com/mpr/mpr/shrinknp_400_400/AAEAAQAAAAAAAANfAAAAJDE1MzNiYjM1LWVjYzUtNDcwZi1hMmExLTQ5ZDVjYzViMDkzYQ.jpg"
		    },
		    {
		        name: "Keanu Reeves",
		        imageUrl: "http://www.latimes.com/includes/projects/hollywood/portraits/keanu_reeves.jpg"
		    },
		    {
		        name: "Natalie Portman",
		        imageUrl: "https://imagemoved.files.wordpress.com/2011/07/no-strings-attached-natalie-portman-19128381-850-1280.jpg"
		    }
	    ],
	    actions: ["upvoted", "promoted", "shared"],
  	    actionTargets: ["your answer", "your post", "your question"]
	};

	//generates a random number between 0 and 2 to select random polling data
	var getRandomNumber = function(){
	    return Math.floor(Math.random() * 3);
	};

	//creates and returns a new notification
	var getNewNotification = function(){
		var userIndex = getRandomNumber();
		var actionIndex = getRandomNumber();
		var actionTargetIndex = getRandomNumber();
		var newNotification = {
			user: pollingData.users[userIndex],
			action: pollingData.actions[actionIndex],
			target: pollingData.actionTargets[actionTargetIndex],
			timestamp: new Date()
		}
		return newNotification;
	};

	//This function calls itslef after random interval
	var dummyPolling = function(){
		var randomInterval = 2*Math.round(Math.random() * (3000 - 500)) + 1000;
		setTimeout(function() {
			$scope.$apply(function(){
				$scope.newNotifications.push(getNewNotification());
				$scope.awaitingNotifications++;
				localStorage.setItem('newNotifications', JSON.stringify($scope.newNotifications));
				localStorage.setItem('awaitingNotifications', JSON.stringify($scope.awaitingNotifications));
			});
			console.log("dummy poll called after "+randomInterval+"ms");
            dummyPolling();  
    	}, randomInterval);
	}

	window.onclick = function(event){
		var clickedElement = angular.element(event.target);
		var clickedDdTrigger = clickedElement.closest('.dd-trigger').length;
		var clickedDdContainer = clickedElement.closest('.dropdown-menu').length;
		if(opendd != null && clickedDdTrigger == 0 && clickedDdContainer == 0){
			hidedd(opendd);
		}
	}
  
  window.onbeforeunload = function(e) {
	  if(opendd != null){
      console.log('closingdd');
      hidedd(opendd); 
    }
	};

	init();
})
    </script>
        `
    this.shadowRoot.appendChild(styleLink);
    }
}
customElements.define('notification-dropdown-element', NotificationDropdown);