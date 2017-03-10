angular.module('orderCloud')
    .controller('UserUploadCtrl', UserUploadController)
;

function UserUploadController($scope) {
    var vm = this;
    vm.userFileData = {};
    vm.userGroupFileData = {};
    vm.locationFileData = {};

    vm.parsedUserData = null;
    vm.parsedUserGroupData = null;
    vm.parsedLocationData = null;

    vm.results = null;
    vm.uploadProgress = [];

    vm.selectUserFile = selectUserFile;
    vm.selectUserGroupFile = selectUserGroupFile;
    vm.selectLocationFile = selectLocationFile;
    vm.clearUserFile = clearUserFile;
    vm.clearUserGroupFile = clearUserGroupFile;
    vm.clearLocationFile = clearLocationFile;

    function selectUserFile() {
        $('#userCSV').bind('change', userFileSelected);
        $('#userCSV').click();
    }

    function selectUserGroupFile() {
        $('#userGroupCSV').bind('change', userGroupFileSelected);
        $('#userGroupCSV').click();
    }

    function selectLocationFile() {
        $('#locationCSV').bind('change', locationFileSelected);
        $('#locationCSV').click();
    }

    function clearUserFile() {
        vm.userFileData = {};
        vm.parsedUserData = null;
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#userCSV').val('');
    }

    function clearUserGroupFile() {
        vm.userGroupFileData = {};
        vm.parsedUserGroupData = null;
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#userGroupCSV').val('');
    }

    function clearLocationFile() {
        vm.locationFileData = {};
        vm.parsedLocationData = null;
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#locationCSV').val('');
    }

    function userFileSelected(event) {
        $scope.apply(function() {
            vm.userFileData.Name = event.target.files[0].name;
            vm.userFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData && vm.userGroupFileData && vm.locationFileData) parsedData();
        })
    }

    function userGroupFileSelected(event) {

    }

    function locationFileSelected(event) {

    }

}