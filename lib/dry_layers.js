/* Copyright (c) 2015 Paul McKay
 * 
 * This file is part of the 'dry-layers' package for Node.js and is subject to
 * the terms of the MIT license.  If the license does not accompany this file, 
 * download it from:
 * https://raw.githubusercontent.com/pmckay/dry-layers/master/LICENSE. 
 */

module.exports = {
        
    Application : require('./application.js').Application,
        
    DataService : require('./data_service.js'),
    
    MeetingService : require('./meeting_service.js'),
    
    Registry : require('./registry.js'),
       
    Renderer : require('./renderer.js'),

    SecurityService : require('./security_service.js'),
    
    StaticService : require('./static_service.js')

}
