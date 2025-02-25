package com.openblocks.sdk.util;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.ResourceBundle;

import com.openblocks.sdk.constants.GlobalContext;
import com.openblocks.sdk.models.LocaleMessage;

import lombok.extern.slf4j.Slf4j;
import reactor.util.context.ContextView;

@Slf4j
public class LocaleUtils {

    public static String getMessage(Locale locale, LocaleMessage localeMessage) {
        return getMessage(locale, localeMessage.messageKey(), localeMessage.args());
    }

    public static String getMessage(Locale locale, String key, Object... args) {

        try {
            ResourceBundle eeBundle = ResourceBundle.getBundle("locale_ee", locale);
            if (eeBundle.getLocale() == locale && eeBundle.containsKey(key.trim())) {
                return eeBundle.getString(key.trim());
            }
        } catch (Exception e) {
            // ignore
        }

        ResourceBundle bundle = ResourceBundle.getBundle("locale", locale);
        if (!bundle.containsKey(key.trim())) {
            log.error("message key not exist ,  {} - {}", locale, key);
            return bundle.getString("INTERNAL_SERVER_ERROR");
        }
        return new MessageFormat(bundle.getString(key.trim())).format(args);
    }

    public static Locale getLocale(ContextView contextView) {
        return contextView.getOrDefault(GlobalContext.CLIENT_LOCALE, getDefaultLocale());
    }

    public static Locale getDefaultLocale() {
        return Locale.US;
    }
}
