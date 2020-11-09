sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/routing/History",
  "sap/m/MessageToast"
], function (Controller, JSONModel, History, MessageToast) {
  "use strict";

  return Controller.extend("i40-aas-registry-ui.i40-aas-registry-ui.controller.ShowAllDescriptors", {

    onInit: function () {
      this.getView().addEventDelegate({
        onAfterShow: this.onAfterShow,
      }, this);
    },

    onAfterShow: function () {
      this.initiateModel();
      this.startAutorefreshModel(30000);
    },

    initiateModel: function () {
      var aAASDescriptors = (function () {
        var aAASDescriptors = null;
        $.ajax({
          'async': false,
          'global': false,
          'url': "/AASDescriptors",
          'dataType': "json",
          'success': function (data) {
            aAASDescriptors = data;
          }
        });
        return aAASDescriptors;
      })();

      var oData = {
        "AASDescriptorsCollection": aAASDescriptors
      };
      var oModel = new JSONModel(oData);
      this.getView().setModel(oModel, "DescriptorList");



    },

    startAutorefreshModel: function (timeInMilliseconds) {
      var self = this;
      this.intervalHandle = setInterval(function () {
        self.initiateModel();
      }, timeInMilliseconds);

    },

    stopAutorefreshModel: function () {
      if (this.intervalHandle)
        clearInterval(this.intervalHandle);
    },

    // --------------- Begin SingleDescriptor -------------------------

    onOpenSingleDescriptor: function (oEvent) {
      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      var oItem = oEvent.getSource();

      //eslint no-console: ["error", { allow: ["warn", "error"] }]
      //console.warn("oItem = " + oItem);
      //console.warn("AASId = " + oItem.getBindingContext("DescriptorList").getProperty("identification/id"));
      var AASId = oItem.getBindingContext("DescriptorList").getProperty("identification/id");
      var AASIdEncoded = encodeURIComponent(AASId);
      //var AASIdDecoded = decodeURIComponent(AASIdEncoded);
      //console.warn("AASId = " + AASId);
      //console.warn("AASIdEncoded = " + AASIdEncoded);
      //console.warn("AASIdDecoded = " + AASIdDecoded);

      oRouter.navTo("SingleDescriptor", {
        AASId: AASIdEncoded
	  });

	  this.stopAutorefreshModel();
    },

    // --------------- End SingleDescriptor ---------------------------

    onNavBack: function () {
      var oHistory = History.getInstance();
      var sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("overview", {}, true);
      }
      this.stopAutorefreshModel();
    },

    onExit: function () {
      // detach delegates
      this.getView().removeEventDelegate(this._afterShowDelegate);
      this._afterShowDelegate = null;
      // stopAutorefresh
      this.stopAutorefreshModel();
    },

  });

});
