var moment = require('moment');
var _ = require('lodash');
var d = require('debug')('climbonio');

var args = process.argv.slice(2);
d('args: ' + args);

var profile = {
    defaultClimber: 'sc',
    defaultLocation: 'pgb',
    defaultIndoorOrOutdoor: 'i',
    defaultType: 'tr',
    climbTypeWeight: {
        'tri': 1,
        'tric': 1,
        'sli': 2,
        'slic': 2,
        'tro': 2,
        'tlo': 6,
        'tfo': 3,
        'slo': 6,
        'sfo': 3, 
        'fso': 6
    },
    climbRatingWeight: {
        '04': 2,
        '06': 3,
        '07': 4,
        '08': 5,
        '09': 6,
        '10a': 8,
        '10b': 10,
        '10c': 12,
        '10d': 15,
        '11a': 16,
        '11b': 18,
        '11c': 20,
        '11d': 22,
        '12a': 24,
        '12b': 26,
        '12c': 28,
        '12d': 30
    },
    boulderRatingWeight: {
        'v0': 2,
        'v1': 4,
        'v2': 8,
        'v3': 12,
        'v4': 15,
        'v5': 20
    }
};

var climber = profile.defaultClimber;
var location = profile.defaultLocation;
var indoorOrOutdoor = profile.defaultIndoorOrOutdoor;
var defaultType = profile.defaultType;

d('climber: ' + climber);
d('location: ' + location);
d('indoorOrOutdoor: ' + indoorOrOutdoor);
d('defaultType: ' + defaultType);



// Parse date
var date = moment(args[0], 'MM-DD-YYYY');
if (date.isValid() === false) {
    console.error('Error: Invalid date found: ' + args[0]);
    process.exit(1);
}
date = date.format('YYYY-MM-DD');
d('date: ' + date);



var workouts = {};
var inDescription = false;
var description = '';
_.each(args.slice(1), function(token) {

    d('\ntoken: ' + token);

    if (inDescription) {
        description += token + ' ';
        return;
    }

    switch (token) {
        
    case '--':
        inDescription = true;
        return;

    case 'sc':
    case 'cl':
        climber = token;
        d('climber: ' + climber);
        return;

    case 's':
    case 'sl':
        defaultType = 'sl';
        d('defaultType: ' + defaultType);
        return;
    case 'tr':
        defaultType = 'tr';
        d('defaultType: ' + defaultType);
        return;

    case 'i':
        indoorOrOutdoor = 'i';
        d('indoorOrOutdoor: ' + indoorOrOutdoor);
        return;
    case 'o':
        indoorOrOutdoor = 'o';
        d('indoorOrOutdoor: ' + indoorOrOutdoor);
        return;

    case 'pgb':
    case 'pgsf':
    case 'pgsv':
        location = token;
        d('location: ' + location);
        return;

    case 'donner':
    case 'yv':
    case 'tuo':
    case 'tahoe':
        location = token;
        d('location: ' + location);
        indoorOrOutdoor = 'o';
        d('indoorOrOutdoor: ' + indoorOrOutdoor);
        return;
    }



    // Normalize the climb rating (for sorting, etc)
    // a -> 10a, b -> 10b, c -> 10c, d -> 10d
    // 5.4 -> '04 ', 5.5 -> '05 ', ..., 5.9 -> '09 '
    // 4 -> '04 ', 5 -> '05 ', ..., 9 -> '09 '
    // v0 -> 'v0 ', v1 -> 'v1 ', ..., v5 -> 'v5 '
    if ((token.indexOf('a') === 0) ||
        (token.indexOf('b') === 0) ||
        (token.indexOf('c') === 0) ||
        (token.indexOf('d') === 0))  {
        token = '10' + token;
    } else if ((token.indexOf('5.4') === 0) ||
               (token.indexOf('5.5') === 0) ||
               (token.indexOf('5.6') === 0) ||
               (token.indexOf('5.7') === 0) ||
               (token.indexOf('5.8') === 0) ||
               (token.indexOf('5.9') === 0))  {
        token = '0' + token.slice(2);
        token = insert(token, 2, ' ');
    } else if ((token.indexOf('4') === 0) ||
               (token.indexOf('5') === 0) ||
               (token.indexOf('6') === 0) ||
               (token.indexOf('7') === 0) ||
               (token.indexOf('8') === 0) ||
               (token.indexOf('9') === 0))  {
        token = '0' + token;
        token = insert(token, 2, ' ');
    } else if ((token.indexOf('v0') === 0) ||
               (token.indexOf('v1') === 0) ||
               (token.indexOf('v2') === 0) ||
               (token.indexOf('v3') === 0) ||
               (token.indexOf('v4') === 0) ||
               (token.indexOf('v5') === 0))  {
        token = insert(token, 2, ' ');
    }
    


    // Handle 10ax2, 10ax2.5, 10ax.5, 
    // Given 10x2.5
    // - multiplier: 2
    // - fraction: .5
    var multiplier = '1';
    var fraction = null;
    var indexOfX = token.indexOf('x');
    if (indexOfX > -1) {
        var climb = token.substring(0, indexOfX);
        multiplier = token.substring(indexOfX + 1);
        var indexOfDot = multiplier.indexOf('.');
        if (indexOfDot > -1) {
            fraction = multiplier.substring(indexOfDot);
            multiplier = multiplier.substring(0, indexOfDot);
            d('climb: ' + climb);
            d('multiplier: ' + multiplier);
            d('fraction: ' + fraction);
        }
        else {
            d('climb: ' + climb);
            d('multiplier: ' + multiplier);
        }
        token = climb;
    }
    else {
        var indexOfDot = token.indexOf('.');
        if (indexOfDot > -1) {
            var climb = token.substring(0, indexOfDot);
            multiplier = '0';
            fraction = token.substring(indexOfDot);
            d('climb: ' + climb);
            // d('multiplier: ' + multiplier);
            d('fraction: ' + fraction);
            token = climb;
        }
    }
    
    var rating = token.slice(0, 3);
    switch (rating) {
    case '04 ':
    case '05 ':
    case '06 ':
    case '07 ':
    case '08 ':
    case '09 ':
    case '10a':
    case '10b':
    case '10c':
    case '10d':
    case '11a':
    case '11b':
    case '11c':
    case '11d':
    case '12a':
    case '12b':
    case '12c':
    case '12d':

        // Find and/or set climb metadata
        // - type: tr, sl, sfo, tl, tf, fs
        // - indoorOrOutdoor: 'i', 'o'
        // - crack: '', 'c'
        rating = rating.trim();
        var type = defaultType;
        var crack = '';

        // Split the rating from the metadata
        var metadata = token.slice(3, token.length);

        switch (metadata) {
        case '':
            break;
        case 'c':
            crack = 'c';
            break;
        case 'tr':
            type = 'tr';
            break;
        case 'trc':
            type = 'tr';
            crack = 'c';
            break;
        case 's':
        case 'sl':
            type = 'sl';
            break;
        case 'sc':
        case 'slc':
            type = 'sl';
            crack = 'c';
            break;
        case 'sf':
            type = 'sf';
            break;
        case 'tl':
            type = 'tl';
            break;
        case 'tf':
            type = 'tf';
            break;
        case 'fs':
            type = 'fs';
            break;
        default:
            console.error('Error: Unknown metadata for the climb: ' + metadata);
            process.exit(1);
        }

        d(rating + ' ' + type + indoorOrOutdoor + crack);

        switch (indoorOrOutdoor) {
        case 'i':
            switch (type) {
            case 'tr':
            case 'sl':
                // Valid types (tr & sl)
                break;
            default:
                console.error('Error: Indoor climb types must be either tr or sl (type: ' + type + ').');
                process.exit(1);
            }
            break;
        case 'o':
            if (crack === 'c') {
                console.error('Error: Outdoor climb types must not be annotated as cracks.');
                process.exit(1);
            }
            break;
        }


        // Lazily create the climber session if one doesn't already exist
        if (workouts[climber] === undefined) {
            workouts[climber] = {};
            workouts[climber].climber = climber;
            workouts[climber].date = '';
            workouts[climber].location = '';
            workouts[climber].description = '';
            workouts[climber].raw = [];
        }

        // Lazily create climbs for the climber's session if none exixts
        if (workouts[climber].climbs === undefined) {
            workouts[climber].climbs = {};
        }

        for (i = 0; i < multiplier; i++) {
            if (workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack] === undefined) {
                workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack] = {};
                workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack].count = 1;
            }
            else {
                workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack].count++;
            }
        }

        if (fraction) {
            if (workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack] === undefined) {
                workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack] = {};
                workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack].count = 0.5;
            }
            else {
                workouts[climber].climbs[rating + ' ' + type + indoorOrOutdoor + crack].count += 0.5;
            }
        }
        break;
        
    case 'v0 ':
    case 'v1 ':
    case 'v2 ':
    case 'v3 ':
    case 'v4 ':
    case 'v5 ':

        rating = rating.trim();

        // Lazily create the climber session if one doesn't already exist
        if (workouts[climber] === undefined) {
            workouts[climber] = {};
            workouts[climber].climber = climber;
            workouts[climber].date = '';
            workouts[climber].location = '';
            workouts[climber].description = '';
        }

        // Lazily create boulders for the climber's session if none exixts
        if (workouts[climber].boulders === undefined) {
            workouts[climber].boulders = {};
        }

        for (i = 0; i < multiplier; i++) {
            if (workouts[climber].boulders[rating] === undefined) {
                workouts[climber].boulders[rating] = {};
                workouts[climber].boulders[rating].count = 1;
            }
            else {
                workouts[climber].boulders[rating].count++;
            }
        }
        
        if (fraction) {
            if (workouts[climber].boulders[rating] === undefined) {
                workouts[climber].boulders[rating] = {};
                workouts[climber].boulders[rating].count = .5;
            }
            else {
                workouts[climber].boulders[rating].count += .5;
            }
        }
        break;

    default:
        console.error('Error: Unknown value (' + token + ').');
        process.exit(1);
    }
});

// Add the date, location, and summary into each climber's climbing session,
// and sort the climbs based on rating
d('args: ' + args);
_.each(workouts, function(workout) {

    if (date) {
        workout.date = date;
    }

    if (location) {
        workout.location = location;
    }

    if (description) {
        workout.description = description.trim();
    }

    workout.raw = args;

    var climbs = 0;
    var boulders = 0;
    var score = 0;

    if (workout.climbs) {
        var orderedClimbs = {};
        Object.keys(workout.climbs).sort().forEach(function(key) {
            orderedClimbs[key] = workout.climbs[key];
        });
        workout.climbs = orderedClimbs;

        _.each(_.keys(workout.climbs), function(rating) {
            var s = rating.split(/[ ]+/);
            workout.climbs[rating].rating_multiplier = profile.climbRatingWeight[s[0]];
            workout.climbs[rating].type_multiplier = profile.climbTypeWeight[s[1]];
            workout.climbs[rating].score = profile.climbRatingWeight[s[0]] * profile.climbTypeWeight[s[1]] * parseInt(workout.climbs[rating].count);
            climbs += parseInt(workout.climbs[rating].count);
            score += workout.climbs[rating].score;
        });
    }
    
    if (workout.boulders) {
        var orderedBoulders = {};
        Object.keys(workout.boulders).sort().forEach(function(key) {
            orderedBoulders[key] = workout.boulders[key];
        });
        workout.boulders = orderedBoulders;

        _.each(_.keys(workout.boulders), function(rating) {
            workout.boulders[rating].rating_multiplier = profile.boulderRatingWeight[rating];
            workout.boulders[rating].score = profile.boulderRatingWeight[rating] * parseInt(workout.boulders[rating].count);
            boulders += parseInt(workout.boulders[rating].count);
            score += workout.boulders[rating].score;
        });
    }

    workout.summary = {};
    if (climbs > 0) {
        workout.summary.climbs = climbs;
    }
    if (boulders > 0) {
        workout.summary.boulders = boulders;
    }
    workout.summary.score = score;

    console.log(JSON.stringify(workout, null, 4));
});

function insert(str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
}
