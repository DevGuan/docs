//apps data

var purl = '/1/';
angular.module("app", ['ui.gravatar']);
angular.module("app").controller("AppCtrl", ['$scope', '$http', '$timeout','$compile','$rootScope',

    function($scope, $http, $timeout, $compile,$rootScope) {
        $scope.appid = "{{appid}}";
        $scope.appkey = "{{appkey}}";
        $rootScope.pageState = {};
        var sdkversion = 'unknown';
        if(typeof $sdk_versions != 'undefined'){
          sdkversion = $sdk_versions;
        }
        angular.element("body").scope().sdkversion = sdkversion;

        $http.get('/1/clients/self').success(function(data){
            $scope.user=data;
        });

        $http.get("/1/clients/self/apps").success(
            function(data) {
                if (data.length > 0) {
                    $rootScope.pageState.currentApp = data[0];
                    $scope.$watch('pageState.currentApp', function() {
                        if($scope.pageState.currentApp&&$scope.pageState.currentApp.app_id){
                            $scope.appid = $scope.pageState.currentApp.app_id;
                            $scope.appkey = $scope.pageState.currentApp.app_key;
                        }
                    });
                    $scope.apps = data;
                }

            }).error(function(data) {

            });
        $scope.signout = function(){
            $http.post('/1/signout').success(function(data) {
                location.reload();
            });
        }

        window.addEventListener("message", receiveMessage, false);

        function receiveMessage(event)
        {
            win.close();
            $scope.$apply(function(){
                getUser();
            });
        }
        var win;
        var commentHost = 'https://comment.avosapps.com';
        $scope.commentHost = commentHost;
        var docVersion = $('html').first().attr('version');

        $scope.loginComment = function(){
            win = openWindow(commentHost+'/users/login','登录',600,500);
            return false
        }

        $scope.showCommentDialog = function(e,snippetVersion){
            $scope.snippetVersion = snippetVersion;
            getCommentsBySnipeet(snippetVersion);
            var mouseX = e.pageX;
            var mouseY = e.pageY;
            var xoffset = 10;
            var yoffset = 10;

            $('#comment-container').fadeIn(100);
            $('#comment-container').css({
                left:mouseX+xoffset,
                top: mouseY+yoffset
            });
            $('p[version=' + snippetVersion + ']').addClass('on');
        }

        function getComments(){
            $http.get(commentHost+'/docs/'+docVersion+'/commentCount',{
                withCredentials: true
            }).success(function(result){
                var all = {};
                angular.forEach(result,function(v,k){
                    // $('[version="'+v.snippetVersion+'"]').append(v.count);
                    all[v.snippetVersion] = v.count;
                });
                $scope.allComment = all;
            });
        }

        $scope.getCommentUser = getUser;
        function getUser(){
            $http.get(commentHost+'/users/current',{
                withCredentials: true
            }).success(function(result){
                $scope.currentCommentUser = result;
            });
        }

        function getCommentsBySnipeet(snippet){
            snippet = snippet || $scope.snippetVersion;
            $http.get(commentHost+'/docs/'+docVersion+'/snippets/'+snippet+'/comments',{
                withCredentials:true
            }).success(function(result){
                $scope.currentComments = result;
            });
        }

        $scope.createComment = function(e){
            if(!$scope.commentContent){
                return;
            }
            $http({
                method: 'post',
                url:commentHost+'/docs/'+docVersion+'/snippets/'+$scope.snippetVersion+'/comments',
                withCredentials: true,
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                transformRequest: function(obj) {
                        var str = [];
                        for(var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        return str.join("&");
                },
                data:{
                    content: $scope.commentContent
                }

            })
            .success(function(result){
                $scope.commentContent = '';
                var snippet = $scope.snippetVersion;
                if($scope.allComment[snippet]){
                    $scope.allComment[snippet]+=1;
                }else{
                    $scope.allComment[snippet]=1;
                }
                $scope.getCommentsBySnipeet();
                var Snippet = AV.Object.extend('Snippet');
                var query =new AV.Query(Snippet);
                query.equalTo('snippetVersion',snippet);
                query.find({
                    success: function(results){
                        if(results && results.length==0){
                            var snippetObj = new Snippet();
                            snippetObj.set('snippetVersion', snippet),
                            snippetObj.set('content',$('[version='+snippet+']').text());
                            snippetObj.set('file',window.location.pathname.split('\/').pop());
                            snippetObj.save();
                        }
                    }
                })
            }).error(function(err){
                if(err.status == 401){
                    // window.open(commentHost+'/users/login')

                    // location.href = commentHost+'/users/login';
                }
            });
        }

        $scope.getCommentsBySnipeet = getCommentsBySnipeet;

        $scope.closeCommentModal = function(){
            $('p[version=' + $scope.snippetVersion + ']').removeClass('on');
            $('#comment-container').fadeOut(100);
        }
        AV.initialize('749rqx18p5866h0ajv0etnq4kbadodokp9t0apusq98oedbb','axxq0621v6pxkya9qm74lspo00ef2gq204m5egn7askjcbib');
        getComments();
        getUser();
    }]);

angular.module('ui.gravatar').config([
    'gravatarServiceProvider', function(gravatarServiceProvider) {
        gravatarServiceProvider.defaults = {
            size         : 100,
            "default": 'https://leancloud.cn/images/static/default-avatar.png' // Mystery man as default for missing avatars
        };

        // Use https endpoint
        gravatarServiceProvider.secure = true;
    }
]);

angular.module('app').controller('StartCtrl', [
    '$http',
    '$scope',
    '$timeout',
    '$compile',
    function ($http, $scope, $timeout, $compile) {
        $scope.links = {
            'android': {
                doc: '/docs/android_guide.html',
                demo: '/docs/sdk_down.html'
            },
            'ios': {
                doc: '/docs/ios_os_x_guide.html',
                demo: '/docs/sdk_down.html'
            },
            'js': {
                doc: '/docs/js_guide.html',
                demo: '/docs/sdk_down.html'
            },
            'unity': {
                doc: '/docs/unity_guide.html',
                demo: '/docs/sdk_down.html'
            },
            'wp': {
                doc: '/docs/dotnet_guide.html',
                demo: '/docs/sdk_down.html'
            }
        };

        $scope.selectedPlat = 'ios';


        $scope.createApp = function () {
            $http.post(purl + 'clients/self/apps', { name: $scope.appname }).success(function (data) {
                $scope.SelectedApp = data;
            }).error(function (data) {
            });
        };



        $scope.$watch('selectedPlat',function(){
            $http.get('start/'+$scope.selectedPlat+'_start.html').
                success(function(result){
                    $('#start-main').html(result);
                    prettyPrepare();
                    prettyPrint();
                    $("pre.prettyprint code").each(function(index, ele) {
                      $(ele).after("<div class='doc-example-action'><button class='copybtn'><span class='icon icon-clipboard'></span></button></div>");
                    });
                    glueCopy();
                    $timeout(function(){
                        $compile($('#start-main').contents())($scope);
                    },0);
                });
        });



    }
]);

angular.module('app').directive('lcComment',['$compile',function($compile){
    return {
        restrict: 'AE',
        scope:{
            version:'@version',
            allComment: '=allComment'
        },
        template:'<div class="toggle-comment" ng-class="{\'has-comments\':allComment[version]}" ng-click="f($event)"><span>{{allComment[version]}}<var ng-show="!allComment[version]">+</var></span></div>',
        link: function(scope, element, attrs) {
            scope.f = function(e){
                scope.$parent.showCommentDialog(e,scope.version);
            }
        }
    }
}]);

// angular.module('app').directive('pre', function() {
//     return {
//         restrict: 'E',
//         link: function postLink(scope, element, attrs) {
//               element.html(prettyPrintOne(element.html()));
//         }
//     };
// });


