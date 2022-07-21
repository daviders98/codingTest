const inquirer = require('inquirer')
const { promises: fsPromises} = require('fs');
const lap = require('./lap')

main()

async function main(){
    const { destinationsArray, driversArray } = await readTextFiles();
    if( destinationsArray.length == driversArray.length && driversArray !=0 ){
        const { matrix, realScoresMatrix } = makeSuitabilityMatrix(destinationsArray,driversArray)
        const result = lap(driversArray.length,matrix)
        formatResult(result,realScoresMatrix,destinationsArray,driversArray)
        return
    }
    console.log('Invalid text file input. Please enter appropiate destinations and drivers.')
}

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

function calculateSuitabilityScore(destination,driver){
    let suitability = destination.length % 2 == 0 ? 
        getDriverVowels(driver)*1.5 : 
        getDriverConsonants(driver)
    return haveCommonFactors(destination,driver) ? 
        suitability*1.5 : 
        suitability
}

/* 
    Regular expressions
    g to search in all string
    i to ignore lowercase/uppercase
*/
function getDriverVowels(driver){
    return (driver.match(/[aeiou]/gi) || []).length
}

function getDriverConsonants(driver){
    return (driver.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length
}

function haveCommonFactors(destination,driver){
    const destinationFactors = getFactors(destination.length)
    const driversFactors = getFactors(driver.length)
    return destinationFactors.some( factor => driversFactors.includes(factor) )
}

function getFactors(number){
    // Make array of numbers [0,1,2, ... number]
    return [...Array(number + 1).keys()]
    // Get rid of numbers that are not divisible by the number or if said number = 1
    .filter(i => number % i === 0 && i != 1 )
}

function formatResult(result,realSSMatrix,destinations,drivers){
    try{
        const realScore = getRealScore(result,realSSMatrix)
        printResults( realScore,result, destinations, drivers )
    }catch(e){
        throw e
    }
}

function getRealScore(result,realSSMatrix){
    return result.col.reduce((acc,val,index)=>
        acc += realSSMatrix[index][val],0)
}

function printResults(realScore, results,destinations,drivers){
    console.log(`The total Suitability Score is: ${realScore}`)
    console.log('Assignments:')
    results.col.map((result,index)=>{
        console.log(`Driver: ${drivers[index]}`)
        console.log(`Destination: ${destinations[result]}\n`)
    })
}