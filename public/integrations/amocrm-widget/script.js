define(['jquery'], function($) {
  var CustomWidget = function() {
    var self = this;

    this.callbacks = {
      render: function() {
        return true;
      },
      init: function() {
        return true;
      },
      bind_actions: function() {
        // Handle click-to-call links in leads and contacts
        $(document).on('click', '.onecall-originate-call', function(e) {
          e.preventDefault();
          var phone = $(this).data('phone');
          var settings = self.get_settings();
          if (!settings.server_url || !settings.api_token) {
            return;
          }
          $.ajax({
            url: settings.server_url + '/api/v1/integrations/amocrm/originate',
            method: 'POST',
            data: { phone: phone, token: settings.api_token }
          });
        });
        return true;
      },
      settings: function() {
        return true;
      },
      onSave: function() {
        return true;
      },
      destroy: function() {
        return true;
      }
    };

    return this;
  };

  return CustomWidget;
});
