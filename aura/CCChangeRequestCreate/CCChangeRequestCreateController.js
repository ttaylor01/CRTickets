({
    doInit : function(component, event, helper) {
        // call the helper class to setup the case object for creation
        helper.getCase(component, event, helper);
        helper.getRequestorPriorityPicklistValues(component, event, helper);
        helper.getTransactionPicklistValues(component, event, helper);
        helper.getControlledDeploymentRequestPicklistValues(component, event, helper);
        helper.getReleaseCommunicationRequiredPicklistValues(component, event, helper);
        helper.getBriefDescriptionPicklistValues(component, 'Case_Reason__c', 'Case_Brief_Description__c');
        helper.getTransactionModePicklistValues(component, event, helper);
        helper.getConnectionTypePicklistValues(component, event, helper);
	},
    doSave : function(component, event, helper) {
        var isValid = helper.validateInput(component,helper);
        if(isValid) {
            // create case
            helper.saveCase(component, event, helper);
        } else {
            helper.displayErrorDialog('IMPORTANT!','Please correct invalid input','error');
        }
    },
    doCancel : function(component, event, helper) {
        var compEvent = component.getEvent("goToTarget");
        compEvent.setParams({
            "targetView": "List",
            "listView": component.get('v.viewSelect')
        });
        compEvent.fire();
    },
    // function call on change tha Dependent field
    onTransactionChange : function(component, event,helper) {
//        helper.toggleVisibility(component);
        var otherTranCmp = component.find('othertransaction');
        if(component.get("v.cs.Transaction__c") === "Other") {
            component.set("v.otherTransactionVisibility",true);
            otherTranCmp.set("v.required",true);
        } else {
            component.set("v.otherTransactionVisibility",false);
            otherTranCmp.set("v.required",false);
            component.set("v.cs.Other_Transaction__c",'');
            $A.util.removeClass(otherTranCmp, "slds-has-error"); // remove red border
            $A.util.addClass(otherTranCmp, "hide-error-message"); // hide error message
        }
        if(component.get("v.cs.Transaction__c") === "Payer Spaces" && component.get("v.cs.Call_Reason__c") === "SSO") {
            component.set("v.sectionVisibility",true);
            var sectionCmp = component.find('sectionCmp');
            var opts = []; // for store picklist values to set on ui field.
            if(component.get("v.cs.Call_Reason__c") === "Payer Spaces") {
                opts.push("Payer Spaces");
                opts.push("Application");
                opts.push("Resource");
                opts.push("News");
            } else if(component.get("v.cs.Call_Reason__c") === "SSO") {
                opts.push("Payer Spaces Application");
                opts.push("Payer Spaces Resource");
            }
            sectionCmp.set('v.defaultPicklistOptsList', opts);
            sectionCmp.refreshCmp();
        } else {
            component.set("v.sectionVisibility",false);
            component.find('sectionCmp').refreshCmp();
        }
    },
    onConnectionTypeChange : function(component, event,helper) {
//        helper.toggleVisibility(component);
        var connectionOtherTranCmp = component.find('connectionother');
        if(component.get("v.cs.Connection_Type__c") === "Other") {
            component.set("v.connectionotherVisibility",true);
            connectionOtherTranCmp.set("v.required",true);
        } else {
            component.set("v.connectionotherVisibility",false);
            connectionOtherTranCmp.set("v.required",false);
            component.set("v.cs.Connection_Other__c",'');
            $A.util.removeClass(connectionOtherTranCmp, "slds-has-error"); // remove red border
            $A.util.addClass(connectionOtherTranCmp, "hide-error-message"); // hide error message
        }

    },
    onSpecialReportingChange : function(component, event,helper) {
//        helper.toggleVisibility(component);
        if(component.find('specialreporting').get('v.checked')) {
            component.set("v.reportingneedsVisibility",true);
        } else {
            component.set('v.reportingneedsVisibility',false);
            component.set("v.cs.Special_Reporting_Needs__c",'');
        }

    },
    onCRFormAttachedChange : function(component,event,helper) {
//        helper.toggleVisibility(component);
        if(component.find('crformattached').get('v.checked')) {
            component.set("v.crformattachedVisibility",true);
        } else {
            component.set('v.crformattachedVisibility',false);
        }
    },
    validateRequestedProdDate : function(component, event, helper) {
        var inputCmp = component.find('requestedproductiondate');
        var inputValue = inputCmp.get("v.value");
        console.log("requestedproductiondate: "+inputValue);
        var validDate = true;
        if(helper.isValidDate(inputValue)) {
            // now check if more than 60 days in future
            var SixyDaysAway = new Date(+new Date + (59 * 24 * 60 * 60 * 1000));
            if(new Date(inputValue) <= SixyDaysAway) {
                validDate = false;
            }
        } else {
            validDate = false;
        }
        if(validDate) {
            inputCmp.set("v.errors", null);
            $A.util.removeClass(inputCmp, "slds-has-error"); // remove red border
        } else {
            $A.util.addClass(inputCmp, "slds-has-error"); // add red border
            inputCmp.set("v.errors", [{message:"You must enter a valid Requested Production Date at least 60 days from today"}]);
        }
    },

    onReasonChange: function(component, event, helper) {
        // get the selected value
        var controllerValueKey = event.getSource().get("v.value");
        /*
         * Handle setting Brief Description
         */
        // get the map values
        var Map = component.get("v.briefDescriptionFieldMap");
        
        // check if selected value is not equal to None then call the helper function.
        // if controller field value is none then make dependent field value is none and disable field
        var resetDependentFields = false;
        if (controllerValueKey !== '--- None ---' && controllerValueKey !== '') {
            
            // get dependent values for controller field by using map[key].  
            // for i.e "USA" is controllerValueKey so in the map give key Name for get map values like 
            // map['USA'] = its return all dependent picklist values of states in USA.
            var listOfDependentFields = Map[controllerValueKey];
            // Handle when there are no dependent values
            if(listOfDependentFields === undefined || (listOfDependentFields.length === 0 )) {
                resetDependentFields = true;
            }
            helper.fetchBriefDescriptionValues(component, listOfDependentFields);
            
        } else {
            resetDependentFields = true;
        }
        if(resetDependentFields) {
            var defaultVal = [{
                class: "optionClass",
                label: '--- None ---',
                value: ''
            }];
            component.find('briefdescription').set("v.options", defaultVal);
            component.find('briefdescription').set("v.errors", null);
            component.set("v.isBriefDescriptionDisable", true);
        }

        /*
         * Handle setting Transaction
         */
        // get the map values
        var tranMap = component.get("v.transactionFieldMap");
        
        // check if selected value is not equal to None then call the helper function.
        // if controller field value is none then make dependent field value is none and disable field
        resetDependentFields = false;
        if (controllerValueKey !== '--- None ---' && controllerValueKey !== '') {
            
            // get dependent values for controller field by using map[key].  
            // for i.e "USA" is controllerValueKey so in the map give key Name for get map values like 
            // map['USA'] = its return all dependent picklist values of states in USA.
            var listOfDependentFields = tranMap[controllerValueKey];
            // Handle when there are no dependent values
            if(listOfDependentFields === undefined || (listOfDependentFields.length === 0 )) {
                resetDependentFields = true;
            }
            console.log("Map for transaction: "+JSON.stringify(listOfDependentFields));
            helper.fetchTransactionValues(component, listOfDependentFields);
            
        } else {
            resetDependentFields = true;
        }
        if(resetDependentFields) {
            var defaultVal = [{
                class: "optionClass",
                label: '--- None ---',
                value: ''
            }];
            component.find('transaction').set("v.options", defaultVal);
            component.find('transaction').set("v.errors", null);
            component.set("v.isTransactionDisable", true);
        }

        // set default values, Description Message, labels and placeholders
        if (controllerValueKey === 'Clinical Implementation') {
            component.set("v.cs.Transaction__c",'Other');
            component.set("v.cs.Other_Transaction__c",'Other');
            component.set("v.descriptionPlaceholder", '(Describe business use case)');
            component.find('description').setCustomValidity('');
            component.set("v.requestDetailsLabel", 'Additional Details');
        } else if(controllerValueKey === 'Payer Spaces') {
            component.set("v.cs.Transaction__c",'Payer Spaces');
            component.set("v.descriptionPlaceholder", '(Please include content requirements such as Title, Subtitle and URL)');
            component.set("v.requestDetailsLabel", 'Application Details (Name/Tag/Version)');
        } else if(controllerValueKey === 'SSO') {
            component.set("v.descriptionPlaceholder", '(Please include SSO URL and Attributes.  Note: at least one URL is required to begin coding for NonProd)');
            component.set("v.requestDetailsLabel", 'SSO Details (Location Description)');
        } else {
            component.set("v.descriptionPlaceholder", '');
            component.set("v.requestDetailsLabel", 'Application Details');
        }

        if(controllerValueKey === "" || controllerValueKey === "--- None ---") {
            helper.resetFields(component);
        }
        // Handle change in field visibility
        helper.toggleVisibility(component);
    },

    // function call on change tha Dependent field    
    onBriefDescriptionChange: function(component, event, helper) {
//        helper.toggleVisibility(component);
        if(component.get("v.cs.Call_Reason__c") === "Payer Spaces") {
            if(component.get("v.cs.Brief_Description__c") === "Existing") {
                component.set("v.requestdetailsVisibility",true);
            } else {
                component.set("v.requestdetailsVisibility",false);
                component.set("v.cs.Request_Details__c",'');
            }
            if(component.get("v.cs.Brief_Description__c") === "New") {
                component.set('v.newpayerspaceVisibility',true);
            } else {
                component.set('v.newpayerspaceVisibility',false);
            }
        }
    },

    // Handler for receiving the updateLookupIdEvent event
    handleContactIdUpdate : function(component, event, helper) {
        // Get the Id from the Event
        var fieldName = 'v.cs.' + event.getParam("fieldAPIName");
        var contactId = event.getParam("sObjectId");
        // Set the Id bound to the View
        component.set(fieldName, contactId);
    },
    // Handler for receiving the clearLookupIdEvent event
    handleContactIdClear : function(component, event, helper) {
        // Clear the Id bound to the View
        var fieldName = 'v.cs.' + event.getParam("fieldAPIName");
        component.set(fieldName, null);
    },
})