/**
 * Quote Formatter Extension
 * 
 * Automatically removes asterisks from within quoted text
 * but preserves them outside quotes
 */

// Get necessary context from SillyTavern
const { eventSource, event_types, extension_settings, saveSettingsDebounced, renderExtensionTemplateAsync } = SillyTavern.getContext();

// Define extension module name for settings
const MODULE_NAME = 'quote_formatter';

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
    
    // First pass: handle quoted text
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
            data.mes = removeAsterisksFromQuotes(data.mes);
            
            // If there are swipes, process them too
            if (data.swipes && Array.isArray(data.swipes)) {
                for (let i = 0; i < data.swipes.length; i++) {
                    if (data.swipes[i] && typeof data.swipes[i] === 'string') {
                        data.swipes[i] = removeAsterisksFromQuotes(data.swipes[i]);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[Quote Formatter] Error processing incoming message:`, error);
    }
}

function onMessageSent(data) {
    try {
        const settings = getSettings();
        if (!settings.enabled || !settings.processOutgoing) return;

        // Process the message being sent
        const context = SillyTavern.getContext();
        const messageIndex = context.chat.length - 1;
        const message = context.chat[messageIndex];

        if (message && message.mes && typeof message.mes === 'string') {
            message.mes = removeAsterisksFromQuotes(message.mes);
        }
    } catch (error) {
        console.error(`[Quote Formatter] Error processing outgoing message:`, error);
    }
}

// Create settings UI
async function createUI() {
    const settings = getSettings();
    
    // Append the HTML template
    const html = await renderExtensionTemplateAsync(MODULE_NAME, 'settings');
    $('#extensions_settings').append(html);
    
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
