## catalogSearch Component Overview

This component includes a Catalog search box with type-ahead functionality that searches on
both categories and products that are assigned to the current user.

The search box directive can be placed anywhere in your HTML by including the following:
```html
<ordercloud-catalog-search></ordercloud-catalog-search>
```

maxprods and maxcats are attributes that can be added to the directive that allow you
to specify the maximum number of items you would like listed in the typeahead for both Products
and Categories respectively. The default value is 5 for each and the maximum is 100 for each.

The following line of code will allow up to 8 items for Products and Categories:

```html
<ordercloud-catalog-search maxprods=8 maxcats=8></ordercloud-catalog-search>
```





