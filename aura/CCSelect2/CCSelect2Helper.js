({
    fetchPickListVal: function(component,helper) {
      /* call the apex getselectOptions method which is returns picklist values
         set the picklist values on "picklistOptsList" attribute [String list].
         which attribute used for iterate the select options in component.
       */  
        var action = component.get("c.getSelectOptions");
        action.setParams({
             "objObject": {sobjectType : component.get('v.obj')},
             "fld": component.get('v.fld')
        });

        action.setCallback(this, function(response) {
            if (response.getState() == "SUCCESS") {
                var allValues = response.getReturnValue();
                console.log("[CCSelect2.fetchPickListVal] allValues: "+allValues);
                helper.populateSelectCmp(component,helper,allValues);
            }
        });
        $A.enqueueAction(action);
    },
    refresh : function(component, event, helper) {
        var ph = 'Select one or more ' + component.get('v.label');
        //       $(".select2Class").select2({
        var tmpStr = '[id$='+component.get('v.selectId')+']';
        console.log("CCSelect2.refresh tmpStr: "+tmpStr);
        $(tmpStr).select2({
            placeholder: ph,
            allowClear: true
        });
    },
    populateSelectCmp : function(component, helper, allValues) {
//        console.log("[CCSelect2.populateSelectCmp] allValues: "+allValues);
        var defaultValue = component.get("v.defaultValue");
        var opts = [];
        var objects = [];
        for (var i = 0; i < allValues.length; i++) {
            opts.push(allValues[i]);
            var obj = new Object();
            obj.data = allValues[i];
            if(defaultValue == allValues[i]) {
                obj.selected = "true";
            } else {
                obj.selected = "false";
            }
            objects.push(obj);
        }
        component.set("v.picklistOptsList", opts);
        component.set("v.defaultPicklistOptsList",opts);
        component.set("v.picklistObjectList", objects);
    },
})