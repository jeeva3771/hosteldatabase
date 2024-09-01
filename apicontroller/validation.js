const v = {
    isUndefined: (value) => {
        return typeof value === 'undefined'
    },
    isNumber: (value) => {
        return isNaN(value) || value <= 0
    },
    numberValidate: (value, name) => {
        if (v.isUndefined(value)) {
            if (!v.isNumber(value))
                return `${name} is invalid`
            else
                return true
        } 
        return `${name} is missing`
    }
}

function validate(body, rules) {
    const errors = []
    for (const [key, fn] of Object.entries(rules)) {
        const result = v[fn](body[key], key)
        if (result !== true) {
            errors.push(result)
        }            
    } 
    return errors
}


module.exports = {
    validate
}




const rules = {
    'blockId': 'numberValidate',
    'floorNumber': 'numberValidate'
}

const errors = validate(body, rules)

const { numberValidate, validate } = require('./validation.js')
