var q,
    scope,
    rootScope,
    compile,
    state,
    injector,
    toastrService,
    uibModalService,
    oc,
    exceptionHandler,
    ocConfirmService,
    ocParametersService,
    parametersResolve,
    selectedProduct,
    productsList,
    dummyPromise,
    mock = _mockData();
beforeEach(module('orderCloud', function($provide) {
    $provide.value('ocStateLoading', {
        'Init': jasmine.createSpy()
    });
    $provide.value('Parameters', mock.Parameters);
    $provide.value('SelectedProduct', mock.SelectedProduct);
    $provide.value('ProductsList', mock.ProductsList);
}));
beforeEach(module('ordercloud-angular-sdk'));
beforeEach(inject(function($q, $rootScope, $compile, $state, $injector, toastr, $uibModal,
OrderCloudSDK, $exceptionHandler, ocConfirm, ocParameters, Parameters, SelectedProduct, ProductsList) {
    q = $q;
    scope = $rootScope.$new();
    rootScope = $rootScope;
    compile = $compile;
    state = $state;
    injector = $injector;
    toastrService = toastr;
    uibModalService = $uibModal;
    oc = OrderCloudSDK;
    exceptionHandler = $exceptionHandler;
    ocConfirmService = ocConfirm;
    ocParametersService = ocParameters;
    parametersResolve = Parameters;
    selectedProduct = SelectedProduct;
    productsList = ProductsList;
    var defer = $q.defer();
    defer.resolve('FAKE_RESPONSE');
    dummyPromise = defer.promise;
}));

function _mockData() {
    return {
        OauthResponse: {
            access_token: 'FAKE_ACCESS_TOKEN',
            refresh_token: 'FAKE_REFRESH_TOKEN'
        },
        DefaultState: 'DEFAULT_STATE',
        ClientID: 'FAKE_CLIENT_ID',
        Scope: ['FAKE_SCOPE'],
        Parameters: {
            search: null,
            page: null,
            pageSize: null,
            searchOn: null,
            sortBy: null,
            filters: {},
            catalogID: null,
            categoryID: null,
            categoryPage: null,
            productPage: null
        },
        Meta: {
            Page: 1,
            PageSize: 20,
            TotalCount:29,
            TotalPages: 3,
            ItemRange : [1,2]
        },
        Catalog: {
            ID: 'CATALOG_ID'
        },
        Buyer: {
            ID: 'BUYER_ID',
            Name: 'BUYER_NAME',
            DefaultCatalogID: 'BUYER_DEFAULT_CATALOG_ID',
            Active: true
        },
        Product: {
            ID: 'PRODUCT_ID',
            Name: 'PRODUCT_NAME',
            PriceSchedule: {
                PriceBreaks: [
                    {
                        Price: '$0.00',
                        Quantity: 1
                    },
                    {
                        Price: '$0.00',
                        Quantity: 1
                    }
                ]
            },
            xp: {
                RelatedProducts: ['relProd1', 'relProd2']
            }
        },
        ProductList: {
            Items: [
                {ID: 'testProd1'},
                {ID: 'testProd2'}
            ]
        },
        Category: {
            ID: 'CATEGORY_ID'
        },
        SelectedProduct: {
            ID: 'PRODUCT_ID',
            xp: {
                RelatedProducts: ['relProd1', 'relProd2']
            }
        }
    }
}