angular.module('app')
.controller('MainCtrl', function ($scope, postsService, $rootScope, commentsService) {
  $('.alert .close').on('click', function (e) {
    $(this).parent().hide();
  });

  $scope.init = function() {
    $scope.currentPage = 1;
    $scope.numPerPage = 5;

    //get all posts on page load
    postsService.getAll(data => {
      console.log('got posts', data);
      $scope.posts = data;

      //pagination
      $scope.$watch('currentPage + numPerPage', function () {
        //filter posts by page number
        let begin = (($scope.currentPage - 1) * $scope.numPerPage);
        let end = begin + $scope.numPerPage;

        $scope.filteredPosts = $scope.posts.slice(begin, end);
      });
    });
  };

  //runs init on view startup
  $scope.init();

  $scope.handlePostClick = (clickedValue) => {
    $('#like-alert').hide();
    $scope.currentPost = $scope.filteredPosts[clickedValue];
    //get all comments from clicked post
    commentsService.getComments($scope.currentPost.post_id, (data) => {
      console.log('comments', data);
      $scope.comments = data;
      $scope.comments.forEach(comment => comment.message = comment.message.replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>'));
      $scope.currentIndex = clickedValue; //sets index for when submit comment is clicked
    });

  };

  //hacky way of refreshing the current view to get new posts
  $scope.refresh = () => {
    $scope.init();
  };

  $scope.toggleStyle = () => {
    let el = document.getElementById("styledark");
    let buttonText = document.getElementById("styletoggle");
    if (el.href.match("https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/darkly/bootstrap.min.css")) {
        el.href = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/flatly/bootstrap.min.css";
        buttonText.innerHTML = 'Dark Mode'
        console.log(el)
    }
    else {
        el.href = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/darkly/bootstrap.min.css";
        buttonText.innerHTML = 'Light Mode'
        console.log(el)
    }
  };

  $scope.message = '';

  $scope.submitComment = (isValid) => {
    if (isValid) {
      let commentObj = {
        user_id: $rootScope.userId,
        post_id: $scope.currentPost.post_id,
        message: $scope.message
      };
      commentsService.submitNewComment(commentObj, (data) => {
        $scope.message = '';
        $scope.handlePostClick($scope.currentIndex);
      });
    }
  };

  $scope.selectSolution = (comment) => {
    if ($rootScope.userId === $scope.currentPost.user_id) {
      $scope.currentPost.solution_id = comment.comment_id; //changes local solution_id so that star moves without refresh
      commentsService.selectSolution(comment.comment_id, $scope.currentPost.post_id);
      console.log('select Solution completed');
    }
  };

  $scope.unselectSolution = (comment) => {
    if (($rootScope.userId === $scope.currentPost.user_id) && ($scope.currentPost.solution_id === comment.comment_id)) {
      $scope.currentPost.solution_id = null;
      commentsService.unselectSolution(comment.comment_id, $scope.currentPost.post_id);
      console.log('UNselect Solution completed');
    }
  };

  $scope.likeComment = async (commentId, index) => {
    //need commmentId, usernameId(rootscope), how many coins to use (ng-click to send one and ng-double click to send more?)
    //TODO add modal for ng-doubleclick
    if ($rootScope.hackcoin <= 0) {
      $('#like-error').show();
    } else {
      let res = await commentsService.likeComment({
        commentId: commentId,
        userId: $rootScope.userId,
        hackCoins: 1
      });

      if (res.status === 200) {
        $scope.$apply(() => {
          --$rootScope.hackcoin;
          $scope.comments[index].votes++;
          if (!$scope.comments[index].voters.hasOwnProperty($rootScope.userId)) {
            $scope.comments[index].voters[$rootScope.userId] = 1;
          } else {
            $scope.comments[index].voters[$rootScope.userId]++;
          }
        });
        $('#like-alert').show();
      }
    }
  };

  $scope.unlikeComment = async (commentId, index) => {
    if ($scope.comments[index].voters[$rootScope.userId] > 0) {
      let res = await commentsService.unlikeComment($rootScope.userId, commentId);

      if (res.status === 204) {
        $scope.$apply(() => {
          ++$rootScope.hackcoin;
          $scope.comments[index].votes--;
          $scope.comments[index].voters[$rootScope.userId]--;
        });
        $('#like-alert').show();
      }
    }
  };

    $scope.multipleLike = async (commentId, index) => {
    if ($rootScope.hackcoin <= 0) {
      $('#like-error').show();
    }
    console.log('like has been double clicked!');
    $('#like-modal').modal('toggle');

  };

});
