const inquirer = require('inquirer')
const { promises: fsPromises} = require('fs');
const lap = require('./lap')

main()

async function main(){
    const { destinationsArray, driversArray } = await readTextFiles();
    if( destinationsArray.length == driversArray.length && driversArray !=0 ){
        const { matrix, realScoresMatrix } = makeSuitabilityMatrix(destinationsArray,driversArray)
        // calculate the maximum possible Suitability Score
        const result = lap(driversArray.length,matrix)
        const realScore = getRealScore(result,realScoresMatrix)
        printResults( realScore,result, destinationsArray, driversArray )
        return
    }
    console.log('Invalid text file input. Please enter appropiate destinations and drivers.')
}

/**
 * @description Read txt files given their path.
 * @params No params required
 * @returns {{driversArray: Array.<string>, destinationsArray: Array.<string> }} Rows from txt files converted to arrays
 * @requires fsPromises from fs
 * @requires inquirer
 */
async function readTextFiles(){
    const questions = [{
        type:'input',
        name:'destinations',
        message:'Please type in the path of the destinations. Ex: tests/destinations.txt\n'
    },{
        type: 'input',
        name: 'drivers',
        message:'Please type in the path of the drivers. Ex: tests/drivers.txt\n'
    }]
    try{
        const answers = await inquirer.prompt(questions)
        const destinationsFile = await fsPromises.readFile(answers.destinations,'utf-8')
        const driversFile = await fsPromises.readFile(answers.drivers,'utf-8')
        return {
            driversArray: driversFile.split(/\r?\n/),
            destinationsArray: destinationsFile.split(/\r?\n/)
        }
    }catch(e){
        throw new Error(`${e.path} not found. please enter the path correctly`)
    }
}

/**
 * @description Generate a Suitability Scores Matrix of size n x m
 * @param {string[]} destinationsArray Array containing destinations
 * @param {string[]} driversArray Array containing drivers
 * @returns {{matrix: Array.<number>, realScoresMatrix: Array.<number> }} Matrices containing suitability scores
 */
function makeSuitabilityMatrix(destinationsArray,driversArray){
    const matrix = []
    const realSSMatrix = []
    driversArray.map((driver)=>{
        const submatrix = []
        const realSSSubMatrix = []
        destinationsArray.map((destination)=>{
            const score = calculateSuitabilityScore(destination,driver)
            submatrix.push(10000-score)
            realSSSubMatrix.push(score)
        })
        matrix.push(submatrix)
        realSSMatrix.push(realSSSubMatrix)
    })
    return {
            matrix: matrix,
            realScoresMatrix: realSSMatrix
    }
}

/**
 * @description Calculates the Suitability Score given a destination and a driver.
 * @param {string} destination String containing destination
 * @param {string} driver String containing driver
 * @returns {number} Suitability Score
 */
function calculateSuitabilityScore(destination,driver){
    let suitability = destination.length % 2 == 0 ? 
        getDriverVowels(driver)*1.5 : 
        getDriverConsonants(driver)
    return haveCommonFactors(destination,driver) ? 
        suitability*1.5 : 
        suitability
}

/**
 * @description Calculates the amount of vowels that a driver's name has.
 * @param {string} driver String containing driver's name
 * @returns {number} Amount of vowels in driver's name
 */
function getDriverVowels(driver){
    /* 
        Regular expressions
        - g to search in all string
        - i to ignore lowercase/uppercase
    */
    return (driver.match(/[aeiou]/gi) || []).length
}

/**
 * @description Calculates the amount of consonants that a driver's name has.
 * @param {string} driver String containing driver's name
 * @returns {number} Amount of consonants in driver's name
 */
function getDriverConsonants(driver){
    return (driver.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length
}

/**
 * @description Determines if the destination and the driver's name length have common factors.
 * @param {string} destination String containing destination's name
 * @param {string} driver String containing driver's name
 * @returns {boolean} true if the names lengths share common factors, false otherwise.
 */
function haveCommonFactors(destination,driver){
    const destinationFactors = getFactors(destination.length)
    const driversFactors = getFactors(driver.length)
    return destinationFactors.some( factor => driversFactors.includes(factor) )
}

/**
 * @description Get all factors given a number.
 * @param {number} number Number to get factors from.
 * @returns {Array.<number>} Array of numbers that are factors of the given number.
 */
function getFactors(number){
    // Make array of numbers [0,1,2, ... number]
    return [...Array(number + 1).keys()]
    // Get rid of numbers that are not divisible by the number or if said number = 1
    .filter(i => number % i === 0 && i != 1 )
}

/**
 * @description Get real Suitability Score from the original Suitability Scores matrix.
 * @param {{col:Array.<number>,row:Array.<number>,cost:number,u:Array.<number>,v:Array.<number}} result Object returned from lap() function.
 * @param {Array.<Array<number>>} realSSMatrix Matrix that contains the real Suitability Scores for the drivers and the destinations.
 * @requires lap
 * @returns {number} Real score of the original Suitability Scores matrix.
 */
function getRealScore(result,realSSMatrix){
    return result.col.reduce((acc,val,index)=>
        acc += realSSMatrix[index][val],0)
}

/**
 * @description Display results to the console
 * @param {number} realScore Total maximum Suitability Score.
 * @param {Array.<number>} results Array containing the optimal destination to choose for each driver.
 * @param {Array.<string>} destinations Array containing all destinations names.
 * @param {Array.<string>} drivers Array containing all drivers names.
 * @returns {void} Only prints, therefore it doesn't return anything
 */
function printResults(realScore, results,destinations,drivers){
    console.log(`The total Suitability Score is: ${realScore}`)
    console.log('Assignments:')
    results.col.map((result,index)=>{
        console.log(`Driver: ${drivers[index]}`)
        console.log(`Destination: ${destinations[result]}\n`)
    })
}