angular.module('orderCloud')
    .controller('UserUploadCtrl', UserUploadController)
;

function UserUploadController($scope, UploadService) {
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
        $scope.$apply(function() {
            vm.userFileData.Name = event.target.files[0].name;
            vm.userFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData && vm.userGroupFileData && vm.locationFileData) parsedData();
        })
    }

    function userGroupFileSelected(event) {
        $scope.$apply(function() {
            vm.userGroupFileData.Name = event.target.files[0].name;
            vm.userGroupFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData && vm.userGroupFileData && vm.locationFileData) parsedData();
        })
    }

    function locationFileSelected(event) {
        $scope.$apply(function() {
            vm.locationFileData.Name = event.target.files[0].name;
            vm.locationFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData && vm.userGroupFileData && vm.locationFileData) parsedData();
        })
    }

    function parsedData() {
        return UploadService.Parse([{UserFile: vm.userFileData.Event}, {UserGroupFile: vm.userGroupFileData.Event}, {LocationFile: vm.locationFileData.Event}])
            .then(function(parsed) {
                var userMapping = {
                    "ID": "",
                    "Username": "username",
                    "FirstName": "firstname",
                    "LastName": "lastname",
                    "Email": "emailaddress",
                    "Phone": "phone",
                    "Active": "active"
                };
                var userGroupMapping = {
                    "ID": "id",
                    "Name": "name"
                };
                var locationMapping = {
                    "ID": "address_id",
                    "CompanyName": "address_name",
                    "Street1": "street_1",
                    "Street2": "street_2",
                    "City": "city",
                    "State": "state",
                    "Zip": "zip",
                    "Country": "country",
                    "Phone": "phone",
                    "AddressName": "address_name"
                };
                vm.parsedUserData = UploadService.ValidateUsers(parsed.UserFile, userMapping);
            })
    }
}