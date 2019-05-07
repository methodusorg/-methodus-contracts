export class Common {
    static getClassMarker(content) {
        let indexOfMethodConfig = content.indexOf('@MethodConfigBase(');
        if (indexOfMethodConfig === -1) {
            indexOfMethodConfig = content.indexOf('@MethodConfig(');
        }

        const classMarker = content.substring(indexOfMethodConfig, content.indexOf('{', indexOfMethodConfig));

        const classRows = classMarker.split('\n');

        if (classRows[0].indexOf(',') > -1) {
            const arr = classRows[0].split(',');
            classRows[0] = arr[0] + arr[arr.length - 1].substr(arr[arr.length - 1].indexOf(')'));
        }
        return classRows.join('\n');
    }

    static handleMethods(content) {
        let methodResult = `return new M.MethodResult({} as any);`;
        let classBody = '';

        const mocksAndMethods = this.parseSigantures(content);

        Object.values(mocksAndMethods).forEach((tuple: any) => {
            if (tuple.comment) {
                classBody += `\n  ${tuple.comment}`;
            }
            if (tuple.mock) {
                const str = tuple.contract.split('@');
                let argsLine = str.map((param) => {
                    if (param.indexOf(':') === -1) {
                        return;
                    }
                    const pair = param.split(')')[1].split(':');
                    return pair[0].trim();

                }).join(', ');

                argsLine = argsLine.trim();
                if (argsLine.indexOf(',') === 0) {
                    argsLine = argsLine.substring(1).trim();
                }
                if (argsLine.indexOf(', securityContext') > -1) {
                    argsLine = argsLine.replace(', securityContext', '').trim();
                }

                tuple.result = `
        return new Promise<any>(function (resolve, reject) {
            resolve(${tuple.mock}.apply(this,[${argsLine}], [${argsLine}]));
        });`;

            }
            if (tuple.method) {
                const resultRegex = /(\<.*\>)./;
                const mo = resultRegex.exec(tuple.contract);
                if (!mo) {
                    throw (new Error('all methods should return a promise of MethodResult object'));
                }
                if (mo.length > 1) {
                    let returnType = mo[1];
                    if (returnType.startsWith('<')) {
                        returnType = returnType.substr(1, returnType.length - 2);
                    }
                    let finalType;
                    const innerTypeRegex = /\<(.*)\>/;
                    const mox = innerTypeRegex.exec(returnType);
                    if (mox && mox.length > 1) {
                        finalType = mox[1];
                    } else {
                        finalType = 'any';
                    }
                    methodResult = `return {} as ${finalType};`;
                    tuple.contract = tuple.contract.replace(returnType, finalType);
                }

                // tslint:disable-next-line:max-line-length
                classBody += `\n  ${tuple.method}\n    ${tuple.contract}\n        ${(tuple.result ? tuple.result : methodResult)}
        }
        `;
            }
        });

        const replaceList = ['Method', 'Param', 'Proxy', 'MethodConfig',
            'MethodConfigBase', 'Body', 'Query', 'Response', 'Request', 'Files',
            'Cookies', 'Headers', 'MethodResult', 'MethodError'];
        classBody = classBody.replace(/\Verbs./g, 'M.Verbs.');
        classBody = classBody.replace(/, \[.*?\]/g, '');
        classBody = classBody.replace(/, @SecurityContext\(\) securityContext: any/g, '');
        replaceList.forEach((value: string) => {
            classBody = classBody.replace(new RegExp('@' + value, 'g'), '@M.' + value);
        });
        return classBody;
    }

    static parseSigantures(content) {
        const regex = /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\/|@MethodMock\(.*\)|@Method\(.*\)|public (.|\n|\r)*? {/g;
        const mockRegex = /@MethodMock\((.*)\)/;
        let m;
        let Tuple: any = {};
        const mocksAndMethods = {};
        // tslint:disable-next-line:no-conditional-assignment
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            m.forEach((match, groupIndex) => {

                if (!match) {
                    return;
                }

                if (match.indexOf('/*') === 0) {
                    Tuple.comment = match;
                }

                if (match.indexOf('@MethodMock') === 0) {

                    const ematch = mockRegex.exec(match);
                    if (ematch && ematch.length > 0) {
                        const resolveKey = ematch[1];
                        Tuple.mock = `${resolveKey}`;
                    }
                }

                if (match.indexOf('@Method(') === 0) {
                    Tuple.method = match;
                }
                if (match.indexOf('public') === 0) {
                    Tuple.contract = match;
                    mocksAndMethods[Tuple.method] = Tuple;
                    Tuple = {};
                }
            });
        }
        return mocksAndMethods;

    }
}
