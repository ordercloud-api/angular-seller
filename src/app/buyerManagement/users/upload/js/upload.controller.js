angular.module('orderCloud')
    .controller('UserUploadCtrl', UserUploadController)
;

function UserUploadController($scope, UploadService, SelectedBuyer) {
    var vm = this;
    vm.selectedBuyer = SelectedBuyer;
    vm.userFileData = {};
    vm.userGroupFileData = {};
    vm.addressFileData = {};

    vm.parsedUserData = null;
    vm.parsedUserGroupData = null;
    vm.parsedAddressData = null;

    vm.results = null;
    vm.uploadProgress = [];

    vm.selectUserFile = selectUserFile;
    vm.selectUserGroupFile = selectUserGroupFile;
    vm.selectAddressFile = selectAddressFile;
    vm.clearUserFile = clearUserFile;
    vm.clearUserGroupFile = clearUserGroupFile;
    vm.clearAddressFile = clearAddressFile;

    function selectUserFile() {
        $('#userCSV').bind('change', userFileSelected);
        $('#userCSV').click();
    }

    function selectUserGroupFile() {
        $('#userGroupCSV').bind('change', userGroupFileSelected);
        $('#userGroupCSV').click();
    }

    function selectAddressFile() {
        $('#addressCSV').bind('change', addressFileSelected);
        $('#addressCSV').click();
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

    function clearAddressFile() {
        vm.addressFileData = {};
        vm.parsedAddressData = null;
        vm.results = null;
        vm.started = false;
        vm.uploadProgress = [];
        $('#addressCSV').val('');
    }

    function userFileSelected(event) {
        $scope.$apply(function() {
            vm.userFileData.Name = event.target.files[0].name;
            vm.userFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData.Name && vm.userGroupFileData.Name && vm.addressFileData.Name) parsedData();
        })
    }

    function userGroupFileSelected(event) {
        $scope.$apply(function() {
            vm.userGroupFileData.Name = event.target.files[0].name;
            vm.userGroupFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData.Name && vm.userGroupFileData.Name && vm.addressFileData.Name) parsedData();
        })
    }

    function addressFileSelected(event) {
        $scope.$apply(function() {
            vm.addressFileData.Name = event.target.files[0].name;
            vm.addressFileData.Event = event;
            vm.parsedData = null;
            if(vm.userFileData.Name && vm.userGroupFileData.Name && vm.addressFileData.Name) parsedData();
        })
    }

    function parsedData() {
        return UploadService.Parse([{UserFile: vm.userFileData.Event}, {UserGroupFile: vm.userGroupFileData.Event}, {AddressFile: vm.addressFileData.Event}])
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
                var addressMapping = {
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
                vm.parsedUserGroupData = UploadService.ValidateUserGroups(parsed.UserGroupFile, userGroupMapping);
                vm.parsedAddressData = UploadService.ValidateAddress(parsed.AddressFile, addressMapping);

                vm.parsedUserData.UserCount = vm.parsedUserData.length;
                vm.parsedUserGroupData.UserGroupCount = vm.parsedUserGroupData.length;
                vm.parsedAddressData.AddressCount = vm.parsedAddressData.length;
            })
    }

    vm.upload = function() {
        vm.results = null;
        vm.uploadProgress = [];
        var users = angular.copy(vm.parsedUserData);
        var userGroups = angular.copy(vm.parsedUserGroupData);
        var addresses = angular.copy(vm.parsedAddressData);
        vm.parsedData = null;
        vm.started = true;
        UploadService.UploadUsers(vm.selectedBuyer.ID, users, userGroups, addresses)
            .then(
                function(data){
                    vm.results = data;
                },
                function(ex) {
                    console.log(ex)
                },
                function(progress) {
                    vm.uploadProgress = progress;
                }
            );
    };
}