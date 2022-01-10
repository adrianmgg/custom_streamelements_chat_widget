// TODO auto google fonts support
// TODO pronouns extension integration
// TODO twemoji integration
// TODO auto text outline when needed (based on preset approximate color) (probably based on wcag contrast ratio)

import { contrastRatio, parseHexColor } from './color';
import { getUserPronouns } from './pronouns_extension_api';
import { setAllCSSVars } from './util';
import { SEEvent, SEChatMessageEventDetail, SEEventListenerDetailTypeMap } from './streamelements';


// let userCurrency; 

let fieldData;

let chat_root;
let chat_template: HTMLTemplateElement;

function init() {
    chat_root = document.getElementsByClassName('chat_root')?.[0];
    chat_template = document.getElementsByClassName('chat_template')?.[0] as HTMLTemplateElement; // FIXE actually check instead of just casting
}

function handle_chat_message(detail: SEChatMessageEventDetail) {
    const template_instance = chat_template.content.firstElementChild.cloneNode(true) as HTMLElement | SVGElement;
    // color
    {
        // temp - randomize color
        detail.event.data.displayColor = `#${Math.floor(Math.random()*255).toString(16).padStart(2,'0')}${Math.floor(Math.random()*255).toString(16).padStart(2,'0')}${Math.floor(Math.random()*255).toString(16).padStart(2,'0')}`;
    }
    setAllCSSVars(template_instance, {
        '--user-color': detail.event.data.displayColor,
    });
    {
        const ratio = contrastRatio(
            parseHexColor(detail.event.data.displayColor),
            parseHexColor('#D2D2D2') // TODO factor out to field
        );
        console.log(ratio);
        const outlineColor = (ratio >= 1.5) ? 'transparent' : 'black';
        setAllCSSVars(template_instance, {
            '--user-color-outline': outlineColor,
        });
    }
    // fill in text
    const username_elems = template_instance.getElementsByClassName('username') as HTMLCollectionOf<HTMLElement>;
    const message_elems = template_instance.getElementsByClassName('message') as HTMLCollectionOf<HTMLElement>;
    const pronoun_container_elems = template_instance.getElementsByClassName('pronoun_container') as HTMLCollectionOf<HTMLElement>;
    const pronoun_text_elems = template_instance.getElementsByClassName('pronoun_text') as HTMLCollectionOf<HTMLElement>;
    const badges_container_elems = template_instance.getElementsByClassName('badges_container') as HTMLCollectionOf<HTMLElement>;
    const username_secondary_container_elems = template_instance.getElementsByClassName('username_secondary_container') as HTMLCollectionOf<HTMLElement>;
    const username_secondary_elems = template_instance.getElementsByClassName('username_secondary') as HTMLCollectionOf<HTMLElement>;
    // message
    for(const el of message_elems) el.textContent = detail.event.data.text;
    // username
    {
        let username_primary = null, username_secondary = null;
        switch(fieldData.localized_name_mode) {
            case 'localized_only': username_primary = detail.event.data.displayName; break;
            case 'unlocalized_only': username_primary = detail.event.data.nick; break;
            case 'both':
                username_primary = detail.event.data.displayName;
                username_secondary = detail.event.data.nick;
                if(username_primary.toLowerCase() === username_secondary.toLowerCase()) username_secondary = null;
                break;
            default: throw 'TODO';
        }
        for(const el of username_elems) el.textContent = username_primary;
        if(username_secondary === null) for(const el of username_secondary_container_elems) el.style.display = 'none';
        else for(const el of username_secondary_elems) el.textContent = username_secondary;
    }
    // badges
    for(const badge of detail.event.data.badges) {
        const img = document.createElement('img');
        img.src = badge.url;
        img.setAttribute('data-badge-type', badge.type);
        img.classList.add('badge');
        // badge.description
        // badge.version
        for(const el of badges_container_elems) el.appendChild(img);
    }
    // pronouns
    if(!fieldData.use_pronouns_extension) {
        for(const el of pronoun_container_elems) el.style.display = 'none';
    } else {
        getUserPronouns(detail.event.data.nick).then(pronouns=>{
            if(pronouns === null) for(const el of pronoun_container_elems) el.style.display = 'none';
            else for(const el of pronoun_text_elems) el.textContent = pronouns;
        });
    }
    //
    chat_root.appendChild(template_instance);
}

const se_event_handlers: { [K in keyof SEEventListenerDetailTypeMap]?: (x: SEEventListenerDetailTypeMap[K]) => void } = {
    message: handle_chat_message,
};

// SE event stuff

window.addEventListener('onEventReceived', function (e: SEEvent) {
    console.log(e);
    se_event_handlers[e.detail.listener]?.(e.detail as any);
});

window.addEventListener('onWidgetLoad', (e: CustomEvent) => {
    // userCurrency = e.detail.currency;
    fieldData = e.detail.fieldData;
    
    init();
});

window.addEventListener('onSessionUpdate', function(e) {
    console.log('onSessionUpdate', e);
});



