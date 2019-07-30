({
    getCase : function(component, event, helper) {
        // Display all cases for selected status
        helper.showSpinner(component, event, helper);
        helper.callServer(component,"c.getCase",function(response,error) {
	        helper.hideSpinner(component, event, helper);
            if(error) {
                // do some error processing
	            helper.displayErrorDialog('IMPORTANT!',error,'error');
            } else {
                // For some reason you have to set individual fields because setting the whole case
                // causes an 'Unable to read sObject' error when passing the case to apex controller upon save
                component.set("v.cs.RecordTypeId",response.RecordTypeId);
                component.set("v.cs.Contact",response.Contact);
                component.set("v.cs.CID_Identifier__c",response.CID_Identifier__c);
                component.set("v.cs.Type",'Payer Request');
                component.set("v.cs.Requestor_Priority__c",'Medium');
                component.set("v.cs.Health_Plan__c",response.Health_Plan__c);
                component.set("v.cs.Status",'New');
                component.set("v.cs.SOW_Required__c",'Yes');
                console.log("[CCChangeRequestCreateHelper.getCase] JSON.stringify'd case: "+JSON.stringify(component.get('v.cs')));
            }
        },
        {
        });
    },
    saveCase : function(component, event, helper) {
        helper.showSpinner(component, event, helper);

        // Obtain multi select picklist values from custom component
        var selectCmp = component.find('regionCmp');
        var selectedOpt = selectCmp.getSelectedValues();
        console.log("[CCChangeRequestCreateHelper.saveCase] regions: "+selectedOpt);
        component.set('v.cs.Region__c',selectedOpt);
        selectCmp = component.find('systemsimpactedCmp');
        selectedOpt = selectCmp.getSelectedValues();
        console.log("[CCChangeRequestCreateHelper.saveCase] systems impacted: "+selectedOpt);
        component.set('v.cs.System_Impacted__c',selectedOpt);
        selectCmp = component.find('transactiontypeCmp');
        selectedOpt = selectCmp.getSelectedValues();
        console.log("[CCChangeRequestCreateHelper.saveCase] transaction type: "+selectedOpt);
        component.set('v.cs.Submitter_Transaction_Type__c',selectedOpt);
        selectCmp = component.find('sectionCmp');
        selectedOpt = selectCmp.getSelectedValues();
        console.log("[CCChangeRequestCreateHelper.saveCase] section/location: "+selectedOpt);
        component.set('v.cs.Section_Location__c',selectedOpt);
        selectCmp = component.find('datatypeCmp');
        selectedOpt = selectCmp.getSelectedValues();
        console.log("[CCChangeRequestCreateHelper.saveCase] data type: "+selectedOpt);
        component.set('v.cs.Data_Types__c',selectedOpt);

        console.log("[CCChangeRequestCreateHelper.saveCase] JSON.stringify'd case: "+JSON.stringify(component.get('v.cs')));
        var caseObj = component.get('v.cs');
        // To help ensure we don't get the dreaded 'Unable to read sObject', set the sobjectType
        caseObj.sobjectType = 'Case';
        helper.callServer(component,"c.saveCase",function(response,error) {
	        helper.hideSpinner(component, event, helper);
            if(error) {
	            helper.displayErrorDialog('IMPORTANT!',error,'error');
            } else {
                // Woohoo.  Let's navigate to detail page
                var compEvent = component.getEvent("goToTarget");
                console.log("[CCChangeRequestCreateHelper.saveCase] Created case Id: "+response.Id);
                compEvent.setParams({
                    "sObjectId": response.Id,
                    "targetView": "Detail",
                    "listView": component.get('v.viewSelect')
                });
                compEvent.fire();
            }
        },
        {
            'cs': caseObj
        });
    },

    toggleVisibility : function(component) {
        this.resetVisibility(component);
        if(component.get("v.cs.Call_Reason__c") === "" || component.get("v.cs.Call_Reason__c") === "--- None ---") {
            this.resetFields(component);
        }
        if(component.get("v.cs.Call_Reason__c") === "Clinical Implementation") {
            component.set("v.facilityVisibility",true);
            component.set("v.censuspoliciesVisibility",true);
            component.set("v.transactiontypeVisibility",true);
            component.set("v.transactionmodeVisibility",true);
            component.set("v.requestdetailsVisibility",true);
            component.set("v.connectiontypeVisibility",true);
            component.set("v.datatypeVisibility",true);
        } else if(component.get("v.cs.Call_Reason__c") === "Payer Spaces") {
            component.set("v.transactionVisibility",true);
            component.set("v.controlleddeploymentVisibility",true);
            component.set("v.releasecommunicationVisibility",true);
            component.set("v.mandatespecialreportingVisibility",true);
            component.set("v.systemsimpactedVisibility",true);
            component.set("v.justificationVisibility",true);
            component.set("v.impactifdatenotmetVisibility",true);
            component.set("v.requestednonproddateVisibility",true);
            component.set("v.healthplanotherVisibility",true);
            component.set("v.sectionVisibility",true);
        } else if(component.get("v.cs.Call_Reason__c") === "SSO") {
            component.set("v.transactionVisibility",true);
            component.set("v.controlleddeploymentVisibility",true);
            component.set("v.systemsimpactedVisibility",true);
            component.set("v.justificationVisibility",true);
            component.set("v.requestednonproddateVisibility",true);
            component.set("v.healthplanotherVisibility",true);
            component.set("v.requestdetailsVisibility",true);
        }
        // Refresh multi picklist components if set to visible
        if(component.get("v.sectionVisibility")) {
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
        }
        if(component.get("v.transactiontypeVisibility")) {
            component.find('transactiontypeCmp').refreshCmp();
        }
        if(component.get("v.datatypeVisibility")) {
            component.find('datatypeCmp').refreshCmp();
        }
        if(component.get("v.systemsimpactedVisibility")) {
            var systemImpactedCmp = component.find('systemsimpactedCmp');
            if(component.get("v.cs.Call_Reason__c") === "Payer Spaces" || component.get("v.cs.Call_Reason__c") === "SSO") {
                systemImpactedCmp.set('v.defaultValue', 'Availity Portal');
                systemImpactedCmp.setValue();
            } else {
                systemImpactedCmp.refreshCmp();
            }
        }
    },
    resetVisibility : function(component) {
        // Reset all visibility sections
//        component.set("v.otherVisibility",false);
        component.set("v.facilityVisibility",false);
        component.set("v.controlleddeploymentVisibility",false);
        component.set("v.releasecommunicationVisibility",false);
        component.set("v.mandatespecialreportingVisibility",false);
        component.set("v.systemsimpactedVisibility",false);
        component.set("v.justificationVisibility",false);
        component.set("v.impactifdatenotmetVisibility",false);
        component.set("v.transactiontypeVisibility",false);
        component.set("v.transactionmodeVisibility",false);
        component.set("v.censuspoliciesVisibility",false);
        component.set("v.requestednonproddateVisibility",false);
        component.set("v.healthplanotherVisibility",false);
        component.set("v.sectionVisibility",false);
        component.set("v.requestdetailsVisibility",false);
        component.set('v.newpayerspaceVisibility',false);
        component.set("v.transactionVisibility",false);
        component.set("v.connectiontypeVisibility",false);
        component.set("v.connectionotherVisibility",false);
        component.set("v.datatypeVisibility",false);
        component.set('v.reportingneedsVisibility',false);
        component.set('v.crformattachedVisibility',false);
    },
    resetFields : function(component) {
        // Reset All fields on Case
        component.find('regionCmp').reset();
        component.find('systemsimpactedCmp').reset();
        component.find('transactiontypeCmp').reset();
        component.find('sectionCmp').reset();
        component.find('datatypeCmp').reset();
        component.set("v.cs.Transaction__c",'');
        component.set("v.cs.Other_Transaction__c",'');
        component.set("v.cs.Transaction_Mode__c",'');
        component.set("v.cs.Submitter_Transaction_Type__c",'');
        component.set("v.cs.Brief_Description__c",'');
        component.set("v.cs.Requested_Non_Prod_Date__c",'');
        component.set("v.cs.Controlled_Deployment_Pilot_Requested__c",'');
        component.set("v.cs.Release_communication_required__c",'');
        component.set("v.cs.Business_Case__c",'');
        component.set("v.cs.Business_Name__c",'');
        component.set("v.cs.NPI_Identifier__c",'');
        component.set("v.cs.Address__c",'');
        component.set("v.cs.Number_of_Facilities__c",'');
        component.set("v.cs.Profile__c",'');
        component.set("v.cs.Mandate__c",false);
        component.set("v.cs.Is_Special_Reporting_Needed__c",false);
        component.set("v.cs.Special_Reporting_Needs__c",'');
        component.set("v.cs.Health_Plan_Other__c",'');
        component.set("v.cs.Transaction_Mode__c",'');
        component.set("v.cs.Justification_for_Request__c",'');
        component.set("v.cs.Impact_on_Payer_if_Date_is_Not_Met__c",'');
        component.set("v.cs.Census_Policies__c",'');
        component.set("v.cs.Subject",'');
        component.set("v.cs.Description",'');
        component.set("v.cs.Request_Details__c",'');
        component.set("v.cs.Attachment__c",false);
        component.set("v.cs.Connection_Type__c",'');
        component.set("v.cs.Connection_Other__c",'');
    },
   
    validateInput : function(component, helper) {
        var allValid = true;

        var inputCmp = component.find("reason");
        var inputValue = inputCmp.get("v.value");
        if(inputValue === undefined || inputValue === "" || inputValue === "--- None ---") {
            inputCmp.set("v.errors", [{message:"Please select a Reason"}]);
            allValid = allValid && false;
        } else {
            inputCmp.set("v.errors", null);
            allValid = allValid && true;
        }
        console.log("validateInput REASON? "+allValid);

        inputCmp = component.find("briefdescription");
        inputValue = inputCmp.get("v.value");
        var inputDisabled = inputCmp.get("v.disabled");
        if(inputDisabled === true) {
            inputCmp.set("v.errors", null);
            allValid = allValid && true;
        } else {
	        if(inputValue === undefined || inputValue === "" || inputValue === "--- None ---") {
	            inputCmp.set("v.errors", [{message:"Please select a Brief Description"}]);
	            allValid = allValid && false;
	        } else {
	            inputCmp.set("v.errors", null);
	            allValid = allValid && true;
	        }
        }
        console.log("validateInput BRIEF DESCRIPTION? "+allValid);

        inputCmp = component.find("requestorpriority");
        inputValue = inputCmp.get("v.value");
        if(inputValue === undefined || inputValue === "" || inputValue === "-- None --") {
            inputCmp.set("v.errors", [{message:"Please select a Requested Priority"}]);
            allValid = allValid && false;
        } else {
            inputCmp.set("v.errors", null);
            allValid = allValid && true;
        }

        inputCmp = component.find('requestedproductiondate');
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
            allValid = allValid && true;
        } else {
            $A.util.addClass(inputCmp, "slds-has-error"); // add red border
            inputCmp.set("v.errors", [{message:"You must enter a valid Requested Production Date at least 60 days from today"}]);
            allValid = allValid && false;
        }

        inputCmp = component.find('regionCmp');
        if(inputCmp.validateInput()) {
            allValid = allValid && true;
            console.log("REGION IS valid");
        } else {
            allValid = allValid && false;
            console.log("REGION NOT valid");
        }

        if(component.get("v.facilityVisibility")) {
            inputCmp = component.find('businessname');
            inputCmp.showHelpMessageIfInvalid();
            allValid = allValid && inputCmp.get('v.validity').valid;
        }

        if(component.get("v.reportingneedsVisibility")) {
            var reportingneedsCmp = component.find('reportingneeds');
            if(component.find('specialreporting').get('v.checked')) {
                reportingneedsCmp.showHelpMessageIfInvalid();
                console.log("reportingneeds valid? "+reportingneedsCmp.get('v.validity').valid);
            } else {
                $A.util.removeClass(reportingneedsCmp, "slds-has-error"); // remove red border
                $A.util.addClass(reportingneedsCmp, "hide-error-message"); // hide error message
            }
            allValid = allValid && reportingneedsCmp.get('v.validity').valid;
        }

        if(component.get("v.systemsimpactedVisibility")) {
            inputCmp = component.find('systemsimpactedCmp');
            if(inputCmp.validateInput()) {
                allValid = allValid && true;
                console.log("Systems Impacted IS valid");
            } else {
                allValid = allValid && false;
                console.log("Systems Impacted NOT valid");
            }
        }

        if(component.get("v.transactionVisibility")) {
            inputCmp = component.find("transaction");
            inputValue = inputCmp.get("v.value");
            if(inputValue === undefined || inputValue === "" || inputValue === "-- None --") {
                inputCmp.set("v.errors", [{message:"Please select a Transaction"}]);
                allValid = allValid && false;
            } else {
                inputCmp.set("v.errors", null);
                allValid = allValid && true;
                if(inputValue === "Other") {
                    var otherTranCmp = component.find('othertransaction');
                    otherTranCmp.showHelpMessageIfInvalid();
                    allValid = allValid && otherTranCmp.get('v.validity').valid;
                }
            }
        }

        if(component.get("v.connectiontypeVisibility")) {
            inputCmp = component.find("connectiontype");
            inputValue = inputCmp.get("v.value");
            if(inputValue === undefined || inputValue === "" || inputValue === "-- None --") {
                inputCmp.set("v.errors", [{message:"Please select a Transaction"}]);
                allValid = allValid && false;
            } else {
                inputCmp.set("v.errors", null);
                allValid = allValid && true;
                if(inputValue === "Other") {
                    var otherConnectionCmp = component.find('connectionother');
                    otherConnectionCmp.showHelpMessageIfInvalid();
                    allValid = allValid && otherTranCmp.get('v.validity').valid;
                }
            }
        }

        if(component.get("v.datatypeVisibility")) {
            inputCmp = component.find('datatypeCmp');
            if(inputCmp.validateInput()) {
                allValid = allValid && true;
                console.log("Systems Impacted IS valid");
            } else {
                allValid = allValid && false;
                console.log("Systems Impacted NOT valid");
            }
        }

        if(component.get("v.justificationVisibility")) {
            inputCmp = component.find('justification');
            inputCmp.showHelpMessageIfInvalid();
            allValid = allValid && inputCmp.get('v.validity').valid;
        }

        if(component.get("v.sectionVisibility")) {
            inputCmp = component.find('sectionCmp');
            if(inputCmp.validateInput()) {
                allValid = allValid && true;
                console.log("Section Location IS valid");
            } else {
                allValid = allValid && false;
                console.log("Section Location NOT valid");
            }
        }
/*
        if(component.get("v.requestdetailsVisibility")) {
            inputCmp = component.find('requestdetails');
            inputCmp.showHelpMessageIfInvalid();
            allValid = allValid && inputCmp.get('v.validity').valid;
        }
*/
        var subjectCmp = component.find('subject');
        subjectCmp.showHelpMessageIfInvalid();
        allValid = allValid && subjectCmp.get('v.validity').valid;
        var descCmp = component.find('description');
        descCmp.showHelpMessageIfInvalid();
        allValid = allValid && descCmp.get('v.validity').valid;
        console.log("validateInput allValid? "+allValid);
        return allValid;
    },
    getTransactionPicklistValues : function(component, event, helper) {
        var picklistValues = []; // for store picklist values to set on ui field.
        picklistValues.push({
            class: "optionClass",
            label: "-- None --",
            value: ""
        });
/*
        picklistValues.push({class: "optionClass",label: "270/271",value: "270/271"});
        picklistValues.push({class: "optionClass",label: "276/277",value: "276/277"});
        picklistValues.push({class: "optionClass",label: "278",value: "278"});
        picklistValues.push({class: "optionClass",label: "835",value: "835"});
        picklistValues.push({class: "optionClass",label: "837",value: "837"});
        picklistValues.push({class: "optionClass",label: "ACE",value: "ACE"});
        picklistValues.push({class: "optionClass",label: "ADT",value: "ADT"});
        picklistValues.push({class: "optionClass",label: "API",value: "API"});
        picklistValues.push({class: "optionClass",label: "Auto Auth",value: "Auto Auth"});
        picklistValues.push({class: "optionClass",label: "HL7",value: "HL7"});
        picklistValues.push({class: "optionClass",label: "Other",value: "Other"});
        picklistValues.push({class: "optionClass",label: "Payer Spaces",value: "Payer Spaces"});
        picklistValues.push({class: "optionClass",label: "PDM",value: "PDM"});
        picklistValues.push({class: "optionClass",label: "RPM",value: "RPM"});
        picklistValues.push({class: "optionClass",label: "SAS",value: "SAS"});
        console.log("[CCChangeRequestCreateHelper.getTransactionPicklistValues] JSON.stringify'd picklistValues: "+JSON.stringify(picklistValues));
*/
        component.find("transaction").set("v.options", picklistValues);
        // Create map of Case Reason to Transaction dependent values
        var defaultValues = []; // for store picklist values to set on ui field.
        defaultValues.push("270/271");
        defaultValues.push("276/277");
        defaultValues.push("278");
        defaultValues.push("278N");
        defaultValues.push("835");
        defaultValues.push("837");
        defaultValues.push("ACE");
        defaultValues.push("ADT");
        defaultValues.push("API");
        defaultValues.push("Auto Auth");
        defaultValues.push("CCDA");
        defaultValues.push("Clinical ADT");
        defaultValues.push("HL7");
        defaultValues.push("ORU");
        defaultValues.push("Other");
        defaultValues.push("Payer Spaces");
        defaultValues.push("PDM");
        defaultValues.push("RPM");
        defaultValues.push("SAS");


        var clinicalImplementationValues = []; // for store picklist values to set on ui field.
        clinicalImplementationValues.push("ADT");
        clinicalImplementationValues.push("ORU");
        clinicalImplementationValues.push("CCDA");
        clinicalImplementationValues.push("278N");
        clinicalImplementationValues.push("Auto Auth");
        clinicalImplementationValues.push("Other");

        var payerSpacesValues = []; // for store picklist values to set on ui field.
        payerSpacesValues.push("Payer Spaces");

        var transactionFieldMap = {
            'Clinical Implementation' : clinicalImplementationValues,
            'Payer Spaces' : payerSpacesValues,
            'SSO' : defaultValues,
            'Other' : defaultValues
        };
        console.log("[CCChangeRequestCreateHelper.getTransactionPicklistValues] JSON.stringify'd transactionFieldMap: "+JSON.stringify(transactionFieldMap));
        // once set #StoreResponse to transactionFieldMap attribute 
        component.set("v.transactionFieldMap", transactionFieldMap);
    },
    getTransactionModePicklistValues : function(component, event, helper) {
        var picklistValues = []; // for store picklist values to set on ui field.
        picklistValues.push({
            class: "optionClass",
            label: "-- None --",
            value: ""
        });
        picklistValues.push({class: "optionClass",label: "Real Time",value: "Real Time"});
        picklistValues.push({class: "optionClass",label: "Batch",value: "Batch"});
        picklistValues.push({class: "optionClass",label: "Other",value: "Other"});
        component.find("transactionmode").set("v.options", picklistValues);
    },
    getRequestorPriorityPicklistValues : function(component, event, helper) {
        var picklistValues = []; // for store picklist values to set on ui field.
        picklistValues.push({
            class: "optionClass",
            label: "-- None --",
            value: ""
        });
        picklistValues.push({class: "optionClass",label: "High",value: "High"});
        picklistValues.push({class: "optionClass",label: "Medium",value: "Medium"});
        picklistValues.push({class: "optionClass",label: "Low",value: "Low"});
        component.find("requestorpriority").set("v.options", picklistValues);
    },
    getControlledDeploymentRequestPicklistValues : function(component, event, helper) {
        var picklistValues = []; // for store picklist values to set on ui field.
        picklistValues.push({
            class: "optionClass",
            label: "-- None --",
            value: ""
        });
        picklistValues.push({class: "optionClass",label: "Yes",value: "Yes"});
        picklistValues.push({class: "optionClass",label: "No",value: "No"});
        component.find("controlleddeploymentrequest").set("v.options", picklistValues);
    },
    getReleaseCommunicationRequiredPicklistValues : function(component, event, helper) {
        var picklistValues = []; // for store picklist values to set on ui field.
        picklistValues.push({
            class: "optionClass",
            label: "-- None --",
            value: ""
        });
        picklistValues.push({class: "optionClass",label: "Yes",value: "Yes"});
        picklistValues.push({class: "optionClass",label: "No",value: "No"});
        component.find("releasecommunicationrequired").set("v.options", picklistValues);
    },
    getConnectionTypePicklistValues : function(component, event, helper) {
        var picklistValues = []; // for store picklist values to set on ui field.
        picklistValues.push({
            class: "optionClass",
            label: "-- None --",
            value: ""
        });
        picklistValues.push({class: "optionClass",label: "VPN",value: "VPN"});
        picklistValues.push({class: "optionClass",label: "SFTP",value: "SFTP"});
        picklistValues.push({class: "optionClass",label: "Other",value: "Other"});
        component.find("connectiontype").set("v.options", picklistValues);
    },

    getBriefDescriptionPicklistValues: function(component, controllerField, dependentField) {
        // call the server side function
        var action = component.get("c.getDependentOptions");
        // pass parameters [object name , controller field name ,dependent field name] -
        // to server side function 
        
        action.setParams({
            'objApiName': component.get("v.objInfo"),
            'contrfieldApiName': controllerField,
            'depfieldApiName': dependentField
        });
        //set callback
        action.setCallback(this, function(response) {
            if (response.getState() === "SUCCESS") {
                //store the return response from server (map<string,List<string>>)  
                var StoreResponse = response.getReturnValue();
                console.log("[CCChangeRequestCreateHelper.getBriefDescriptionPicklistValues] JSON.stringify'd Case Reason Map: "+JSON.stringify(StoreResponse));
                
                // once set #StoreResponse to briefDescriptionFieldMap attribute 
                component.set("v.briefDescriptionFieldMap", StoreResponse);

                // SET ROOT CONTROLLING FIELD BASED ON INITIAL MAP
                // No need to set remaining controlling fields
                // create a empty array for store map keys(@@--->which is controller picklist values)
                
                var listOfkeys = []; // for store all map keys (controller picklist values)
                var ControllerField = []; // for store controller picklist value to set on ui field.
                
                // play a for loop on Return map 
                // and fill the all map key on listOfkeys variable.
                for (var singlekey in StoreResponse) {
                    listOfkeys.push(singlekey);
                }
                
                //set the controller field value for ui:inputSelect  
                if (listOfkeys != undefined && listOfkeys.length > 0) {
                    ControllerField.push({
                        class: "optionClass",
                        label: "--- None ---",
                        value: ""
                    });
                }
                
                for (var i = 0; i < listOfkeys.length; i++) {
                    ControllerField.push({
                        class: "optionClass",
                        label: listOfkeys[i],
                        value: listOfkeys[i]
                    });
                }
                // set the ControllerField variable values (controller picklist field)
                component.find('reason').set("v.options", ControllerField);
            }
        });
        $A.enqueueAction(action);
    },
    fetchBriefDescriptionValues: function(component, ListOfDependentFields) {
        // create a empty array var for store dependent picklist values for controller field)  
        var dependentFields = [];
        
        if (ListOfDependentFields != undefined && ListOfDependentFields.length > 0) {
            dependentFields.push({
                class: "optionClass",
                label: "--- None ---",
                value: ""
            });
            
        }
        for (var i = 0; i < ListOfDependentFields.length; i++) {
            dependentFields.push({
                class: "optionClass",
                label: ListOfDependentFields[i],
                value: ListOfDependentFields[i]
            });
        }
        // set the dependentFields variable values to State(dependent picklist field) on ui:inputselect    
        component.find('briefdescription').set("v.options", dependentFields);
        // make disable false for ui:inputselect field 
        component.set("v.isBriefDescriptionDisable", false);
    },
    fetchTransactionValues: function(component, ListOfDependentFields) {
        // create a empty array var for store dependent picklist values for controller field)  
        var dependentFields = [];
        
        if (ListOfDependentFields != undefined && ListOfDependentFields.length > 0) {
            dependentFields.push({
                class: "optionClass",
                label: "--- None ---",
                value: ""
            });
            
        }
        for (var i = 0; i < ListOfDependentFields.length; i++) {
            dependentFields.push({
                class: "optionClass",
                label: ListOfDependentFields[i],
                value: ListOfDependentFields[i]
            });
        }
        // set the dependentFields variable values to State(dependent picklist field) on ui:inputselect    
        component.find('transaction').set("v.options", dependentFields);
        // make disable false for ui:inputselect field 
        component.set("v.isTransactionDisable", false);
    },

    isValidDate : function(dateString) {
        // First check for existence of value
        if(dateString === undefined || dateString === "") {
            return false;
        }
        // First check for the pattern: yyyy-mm-dd
//        if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        if(!/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(dateString)) {
            return false;
        }
        
        // Parse the date parts to integers (format: yyyy-mm-dd)
        var parts = dateString.split("-");
        var year = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10);
        var day = parseInt(parts[2], 10);
        console.log("dateString parts: "+parts);
        
        // Check the ranges of month and year
        if(year < 1000 || year > 3000 || month == 0 || month > 12)
            return false;
        
        var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
        
        // Adjust for leap years
        if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
            monthLength[1] = 29;
        
        // Check the range of the day
        return day > 0 && day <= monthLength[month - 1];
    },
})