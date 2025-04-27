/**
 * Quote Formatter Extension
 * 
 * Automatically removes asterisks from within quoted text
 * but preserves them outside quotes
 */

import { eventSource, event_types, extension_settings, saveSettingsDebounced } from "../../../../scripts/extensions.js";
import { substituteParams } from "../../../../scripts/substitute.js";
import { updateMessageBlock, saveChatConditional } from "../../../../script.js";

// Define extension module name for settings
export const MODULE_NAME = 'quote_formatter';

// Default settings
const defaultSettings = {
    enabled: true,
    processIncoming: true,   // Process AI messages
    processOutgoing: true    // Process user messages
};

// Initialize settings
function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = Object.assign({}, defaultSettings);
        saveSettingsDebounced();
    }
    
    // Ensure all default keys exist (helpful after updates)
    for (const key in defaultSettings) {
        if (extension_settings[MODULE_NAME][key] === undefined) {
            extension_settings[MODULE_NAME][key] = defaultSettings[key];
        }
    }
    
    return extension_settings[MODULE_NAME];
}

// Main transformation function - removes asterisks from inside quotes
function removeAsterisksFromQuotes(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Replace asterisks inside quotes with nothing
    return text.replace(/"([^"]*)"/g, (match, content) => {
        // Remove all asterisks from content within quotes
        const cleanContent = content.replace(/\*/g, '');
        return `"${cleanContent}"`;
    });
}

// Event handlers for incoming and outgoing messages
function onMessageReceived(data) {
    try {
        const settings = getSettings();
        if (!settings.enabled || !settings.processIncoming) return;

        // Process only if we have a message with text
        if (data && data.mes && typeof data.mes === 'string') {
            // Process message text and update it
            const originalText = data.mes;
            data.mes = removeAsterisksFromQuotes(data.mes);
            
            // If there are swipes, process them too
            if (data.swipes && Array.isArray(data.swipes)) {
                for (let i = 0; i < data.swipes.length; i++) {
                    if (data.swipes[i] && typeof data.swipes[i] === 'string') {
                        data.swipes[i] = removeAsterisksFromQuotes(data.swipes[i]);
                    }
                }
            }
            
            // If text was changed, update the message block
            if (originalText !== data.mes && data.index !== undefined) {
                updateMessageBlock(data.index, data, { transformMessage: true });
                saveChatConditional();
            }
        }
    } catch (error) {
        console.error(`[Quote Formatter] Error processing incoming message:`, error);
    }
}

function onMessageSent(messageId) {
    try {
        const settings = getSettings();
        if (!settings.enabled || !settings.processOutgoing) return;

        // Get the chat context
        const context = SillyTavern.getContext();
        const message = context.chat[messageId];

        if (message && message.mes && typeof message.mes === 'string') {
            const originalText = message.mes;
            message.mes = removeAsterisksFromQuotes(message.mes);
            
            // If text was changed, update the message block
            if (originalText !== message.mes) {
                updateMessageBlock(messageId, message, { transformMessage: true });
                saveChatConditional();
            }
        }
    } catch (error) {
        console.error(`[Quote Formatter] Error processing outgoing message:`, error);
    }
}

// Setup the UI settings
function setupSettings() {
    const settings = getSettings();
    
    // Initialize checkboxes
    $('#quote_formatter_enabled').prop('checked', settings.enabled);
    $('#quote_formatter_incoming').prop('checked', settings.processIncoming);
    $('#quote_formatter_outgoing').prop('checked', settings.processOutgoing);
    
    // Add event listeners
    $('#quote_formatter_enabled').on('change', function() {
        settings.enabled = $(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#quote_formatter_incoming').on('change', function() {
        settings.processIncoming = $(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#quote_formatter_outgoing').on('change', function() {
        settings.processOutgoing = $(this).prop('checked');
        saveSettingsDebounced();
    });
}

// Initialize extension
jQuery(async () => {
    // Setup event listeners
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
    
    // Setup settings UI
    setupSettings();
    
    console.log(`[${MODULE_NAME}] Extension loaded`);
});
    
    // Event listeners for settings
    $('#quote_formatter_enabled').on('change', function() {
        settings.enabled = $(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#quote_formatter_incoming').on('change', function() {
        settings.processIncoming = $(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#quote_formatter_outgoing').on('change', function() {
        settings.processOutgoing = $(this).prop('checked');
        saveSettingsDebounced();
    });
}

// Initialize extension
function init() {
    getSettings();
    
    // Register event listeners for message processing
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
    
    // Create settings UI
    createUI();
    
    console.log('Quote Formatter extension initialized');
}

// Initialize the extension when jQuery is ready
jQuery(async () => {
    init();
});
