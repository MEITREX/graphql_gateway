import {Resolvers} from "../.mesh";

const resolvers: Resolvers = {
    QuizMutation: {
        
        addMultipleChoiceQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let oldItems= assessment.items;
                let items=assessment.items;
                items=[...items,_args.item];
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            id
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});

                let questionInput=_args.questionInput;
                questionInput.itemId= updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id)).id;

                let selectionSetQuiz=`{_internal_noauth_addMultipleChoiceQuestion(input: {
                    itemId: "${questionInput.itemId}",
                    ${questionInput.number != null ? `number:${questionInput.number},` : ''}
                    text: ${JSON.stringify(questionInput.text)},
                    answers: [
                        ${questionInput.answers.map(answer => `{
                            answerText: ${JSON.stringify(answer.answerText)},
                            correct: ${answer.correct},
                            ${answer.feedback != null ? `feedback:${JSON.stringify(answer.feedback)}` : ''}
                        }`)}
                    ],
                    ${questionInput.hint != null ? `hint:${JSON.stringify(questionInput.hint)}` : ''}
                }){
                    assessmentId
                    questionPool {
                        __typename
                        itemId
                        type
                        hint
                        number
                        ... on MultipleChoiceQuestion {
                            text
                            answers {
                            answerText
                            correct
                            feedback
                            }
                        }
                        ... on ClozeQuestion{
                            clozeElements {
                                  __typename
                                  ... on ClozeTextElement {
                                      text
                                  }
                                  ... on ClozeBlankElement {
                                      correctAnswer
                                      feedback
                                  }
                              }
                            allBlanks
                            showBlanksList
                            additionalWrongAnswers
                        }
                        ... on AssociationQuestion{
                            text
                            correctAssociations {
                                left
                                right
                            }
                        }

                    } 
                }}`
                let question = await context.QuizService.Mutation.mutateQuiz({
                    root,
                    args:{
                        assessmentId:_args.assessmentId
                     },
                    selectionSet:selectionSetQuiz,
                    context,
                    info
                    });
            
                let returnItem;
                returnItem = updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id));
                let quizOutput = {
                    assessmentId:question._internal_noauth_addMultipleChoiceQuestion.assessmentId,
                    questionPool:question._internal_noauth_addMultipleChoiceQuestion.questionPool,
                    item:returnItem
                }; // Initialize the variable
                return quizOutput;
            },

        },
        updateMultipleChoiceQuestion: {
            async resolve(root, _args, context, info) {
                                // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let items=assessment.items;
                for(let i=0;i<items.length;i++){
                    if(_args.item.id==items[i].id ){
                        items[i]=_args.item
                    }
                }
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            id
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;

                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
    
              
                let questionInput=_args.questionInput;


let selectionSetQuiz=`{_internal_noauth_updateMultipleChoiceQuestion(input: {
    itemId: "${questionInput.itemId}",
    text: ${JSON.stringify(questionInput.text)},
    answers: [
        ${questionInput.answers.map(answer => `{
            answerText: ${JSON.stringify(answer.answerText)},
            correct: ${answer.correct},
            feedback: ${JSON.stringify(answer.feedback)}
        }`)}
    ],
    ${questionInput.hint != null ? `hint:${JSON.stringify(questionInput.hint)}` : ''}
}){
    assessmentId
    questionPool {
        __typename
        itemId
        type
        hint
        number
        ... on MultipleChoiceQuestion {
            text
            answers {
            answerText
            correct
            feedback
            }
        }
        ... on ClozeQuestion{
            clozeElements {
                  __typename
                  ... on ClozeTextElement {
                      text
                  }
                  ... on ClozeBlankElement {
                      correctAnswer
                      feedback
                  }
              }
            allBlanks
            showBlanksList
            additionalWrongAnswers
        }
        ... on AssociationQuestion{
            text
            correctAssociations {
                left
                right
            }
        }

    } 
}}`

                let question = await context.QuizService.Mutation.mutateQuiz({
                    root,
                    args: {
                        assessmentId:_args.assessmentId
                     },
                    selectionSet:selectionSetQuiz,
                    context,
                    info
                    });

                let returnItem=updatedItems.updateAssessment.items.find(item => item.id == _args.item.id);

                let quizOutput = {
                    assessmentId: question._internal_noauth_updateMultipleChoiceQuestion.assessmentId,
                    questionPool: question._internal_noauth_updateMultipleChoiceQuestion.questionPool,
                    item:returnItem
                }; // Initialize the variable
                return quizOutput;
            },

        },
        addClozeQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                               // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let oldItems= assessment.items;
                let items=assessment.items;
                items=[...items,_args.item];
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            id
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});

            
                let questionInput=_args.questionInput;
                questionInput.itemId= updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id)).id;
                let selectionSetQuiz = `{_internal_noauth_addClozeQuestion(input: {
                    itemId: "${questionInput.itemId}",
                    ${questionInput.number != null ? `number:${questionInput.number},` : ''}
                    clozeElements: [
                        ${questionInput.clozeElements.map(element => {
                            if (element.type === "TEXT") {
                                return `{
                                    type: TEXT,
                                    ${element.text != null ? `text:${JSON.stringify(element.text)}` : ''}
                                }`
                            } else if (element.type === "BLANK") {
                                return `{
                                    type: BLANK,
                                    ${element.correctAnswer != null ? `correctAnswer:"${element.correctAnswer}",` : ''}
                                    ${element.feedback != null ? `feedback:${JSON.stringify(element.feedback)}` : ''}
                                }`
                            }
                        })}
                    ],
                    additionalWrongAnswers: ["${questionInput.additionalWrongAnswers.join('", "')}" ],
                    showBlanksList: ${questionInput.showBlanksList},
                    ${questionInput.hint != null ? `hint:${JSON.stringify(questionInput.hint)}` : ''}
                }) {
                    assessmentId
                    questionPool {
                        __typename
                        itemId
                        type
                        hint
                        number
                        ... on MultipleChoiceQuestion {
                            text
                            answers {
                            answerText
                            correct
                            feedback
                            }
                        }
                        ... on ClozeQuestion{
                            clozeElements {
                                  __typename
                                  ... on ClozeTextElement {
                                      text
                                  }
                                  ... on ClozeBlankElement {
                                      correctAnswer
                                      feedback
                                  }
                              }
                            allBlanks
                            showBlanksList
                            additionalWrongAnswers
                        }
                        ... on AssociationQuestion{
                            text
                            correctAssociations {
                                left
                                right
                            }
                        }

                    } 
                }}`;

                let question = await context.QuizService.Mutation.mutateQuiz({
                    root,
                    args:{
                        assessmentId:_args.assessmentId
                     },
                    selectionSet:selectionSetQuiz,
                    context,
                    info
                    });
                let returnItem;
                returnItem = updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id));
                let quizOutput = {
                    assessmentId:question._internal_noauth_addClozeQuestion.assessmentId,
                    questionPool:question._internal_noauth_addClozeQuestion.questionPool,
                    item:returnItem
                }; // Initialize the variable

                return quizOutput;
   
            },

        },
        updateClozeQuestion: {
            async resolve(root, _args, context, info) {
                                // find out in which course the chapter this assessment should be created in is
            let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let items=assessment.items;
                items.map(item => item.id ===_args.item.id ? _args.item : item);
                for(let i=0;i<items.length;i++){
                    if(_args.item.id==items[i].id ){
                        items[i]=_args.item
                    }
                }

                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            id
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
    
              
                let questionInput=_args.questionInput;

                let selectionSetQuiz = `{_internal_noauth_updateClozeQuestion(input: {
                    itemId: "${questionInput.itemId}",
                    clozeElements: [
                        ${questionInput.clozeElements.map(element => {
                            if (element.type === "TEXT") {
                                return `{
                                    type: TEXT,
                                    ${element.text != null ? `text:${JSON.stringify(element.text)}` : ''}
                                }`
                            } else if (element.type === "BLANK") {
                                return `{
                                    type: BLANK,
                                    ${element.correctAnswer != null ? `correctAnswer:"${element.correctAnswer}",` : ''}
                                    ${element.feedback != null ? `feedback:${JSON.stringify(element.feedback)}` : ''}
                                }`
                            }
                        })}
                    ],
                    additionalWrongAnswers: ["${questionInput.additionalWrongAnswers.join('", "')}" ],
                    showBlanksList: ${questionInput.showBlanksList},
                    ${questionInput.hint != null ? `hint:${JSON.stringify(questionInput.hint)}` : ''}
                }) {
                    assessmentId
                    questionPool {
                        __typename
                        itemId
                        type
                        hint
                        number
                        ... on MultipleChoiceQuestion {
                            text
                            answers {
                            answerText
                            correct
                            feedback
                            }
                        }
                        ... on ClozeQuestion{
                            clozeElements {
                                  __typename
                                  ... on ClozeTextElement {
                                      text
                                  }
                                  ... on ClozeBlankElement {
                                      correctAnswer
                                      feedback
                                  }
                              }
                            allBlanks
                            showBlanksList
                            additionalWrongAnswers
                        }
                        ... on AssociationQuestion{
                            text
                            correctAssociations {
                                left
                                right
                            }
                        }

                    } 
                }}`;

                let question = await context.QuizService.Mutation.mutateQuiz({
                    root,
                    args:{
                        assessmentId:_args.assessmentId
                     },
                    selectionSet:selectionSetQuiz,
                    context,
                    info
                    });
                let returnItem=updatedItems.updateAssessment.items.find(item => item.id == _args.item.id);

                let quizOutput = {
                    assessmentId: question._internal_noauth_updateClozeQuestion.assessmentId,
                    questionPool: question._internal_noauth_updateClozeQuestion.questionPool,
                    item:returnItem
                }; // Initialize the variable
                return quizOutput;

            },

        },
        addAssociationQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                              // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let oldItems= assessment.items;
                let items=assessment.items;
                items=[...items,_args.item];
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            id
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
                
                let questionInput=_args.questionInput;
                questionInput.itemId= updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id)).id;

                let selectionSetQuiz=`{_internal_noauth_addAssociationQuestion(input: {
                    itemId: "${questionInput.itemId}",
                    ${questionInput.number != null ? `number:${questionInput.number},` : ''}
                    text: ${JSON.stringify(questionInput.text)},
                    correctAssociations: [
                        ${questionInput.correctAssociations.map(association => `{
                            left: ${JSON.stringify(association.left)},
                            right: ${JSON.stringify(association.right)},
                            ${association.feedback!= null ? `feedback:${JSON.stringify(association.feedback)}` : ''}
                        }`)}
                    ],
                    ${questionInput.hint != null ? `hint:${JSON.stringify(questionInput.hint)}` : ''}
                }) {
                    assessmentId
                    questionPool {
                        __typename
                        itemId
                        type
                        hint
                        number
                        ... on MultipleChoiceQuestion {
                            text
                            answers {
                            answerText
                            correct
                            feedback
                            }
                        }
                        ... on ClozeQuestion{
                            clozeElements {
                                  __typename
                                  ... on ClozeTextElement {
                                      text
                                  }
                                  ... on ClozeBlankElement {
                                      correctAnswer
                                      feedback
                                  }
                              }
                            allBlanks
                            showBlanksList
                            additionalWrongAnswers
                        }
                        ... on AssociationQuestion{
                            text
                            correctAssociations {
                                left
                                right
                            }
                        }

                    } 
                }}`;

                let question = await context.QuizService.Mutation.mutateQuiz({
                    root,
                    args:{
                        assessmentId:_args.assessmentId
                     },
                    selectionSet:selectionSetQuiz,
                    context,
                    info
                    });

                    let returnItem;
                    returnItem = updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id));
                let quizOutput = {
                    assessmentId: question._internal_noauth_addAssociationQuestion.assessmentId,
                    questionPool: question._internal_noauth_addAssociationQuestion.questionPool,
                    item:returnItem
                }; // Initialize the variable
                
                return quizOutput;


            },

        },
        updateAssociationQuestion: {
            async resolve(root, _args, context, info) {
                                // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let items=assessment.items;
                for(let i=0;i<items.length;i++){
                    if(_args.item.id==items[i].id ){
                        items[i]=_args.item
                    }
                }
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            id
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
    
              
                let questionInput=_args.questionInput;

                let selectionSetQuiz=`{_internal_noauth_updateAssociationQuestion(input: {
                    itemId: "${questionInput.itemId}",
                    text: ${JSON.stringify(questionInput.text)},
                    correctAssociations: [
                        ${questionInput.correctAssociations.map(association => `{
                            left: ${JSON.stringify(association.left)},
                            right: ${JSON.stringify(association.right)},
                            ${association.feedback!= null ? `feedback:${JSON.stringify(association.feedback)}` : ''}
                        }`)}
                    ],
                    ${questionInput.hint != null ? `hint:${JSON.stringify(questionInput.hint)}` : ''}
                }) {
                    assessmentId
                    questionPool {
                        __typename
                        itemId
                        type
                        hint
                        number
                        ... on MultipleChoiceQuestion {
                            text
                            answers {
                            answerText
                            correct
                            feedback
                            }
                        }
                        ... on ClozeQuestion{
                            clozeElements {
                                  __typename
                                  ... on ClozeTextElement {
                                      text
                                  }
                                  ... on ClozeBlankElement {
                                      correctAnswer
                                      feedback
                                  }
                              }
                            allBlanks
                            showBlanksList
                            additionalWrongAnswers
                        }
                        ... on AssociationQuestion{
                            text
                            correctAssociations {
                                left
                                right
                            }
                        }

                    } 
                }}`;


                let question = await context.QuizService.Mutation.mutateQuiz({
                    root,
                    args:{
                        assessmentId:_args.assessmentId
                     },
                    selectionSet:selectionSetQuiz,
                    context,
                    info
                    });

                let returnItem=updatedItems.updateAssessment.items.find(item => item.id == _args.item.id);

                let quizOutput = {
                    assessmentId: question._internal_noauth_updateAssociationQuestion.assessmentId,
                    questionPool: question._internal_noauth_updateAssociationQuestion.questionPool,
                    item:returnItem
                }; // Initialize the variable
                return quizOutput;


            },

        },
        addExactAnswerQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                               // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let oldItems= assessment.items;
                let items=assessment.items;
                items=[...items,_args.item];
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});

                let questionInput=_args.questionInput;
                for (let item of updatedItems.updateAssessment.items) {
                    if (!oldItems.some(oldItem => oldItem.id === item.id)) {
                        questionInput.itemId= item.id;
                        break;
                    }
                }


                let selectionSetQuiz= `{
                    {
                        _internal_noauth_addExactAnswerQuestion(input: {
                          itemId: "${questionInput.itemId}",
                          number: ${questionInput.number},
                          text: "${questionInput.text}",
                          caseSensitive: ${questionInput.caseSensitive},
                          correctAnswers: [
                            ${questionInput.correctAnswers.map(answer => `"${answer}"`)}
                          ],
                          feedback: "${questionInput.feedback}",
                          hint: "${questionInput.hint}"
                        }) {
                          itemId
                          number
                          text
                          caseSensitive
                          correctAnswers
                          feedback
                          hint
                        }
                      }`;
                  let assessmentId="assessmentId:"+_args.assessmentId;

                  let question = await context.QuizService.Mutation.mutateQuiz({
                      root,
                      args: {
                          assessmentId
                      },
                      selectionSet:selectionSetQuiz,
                      context,
                      info
                      });
  

                 return question._internal_noauth_addExactAnswerQuestion;
            },

        },
        updateExactAnswerQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let items=assessment.items;
                items.map(item => item.id ===_args.item.id ? _args.item : item);
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
    
              
                let questionInput=_args.questionInput;

                let selectionSetQuiz= `{
                    _internal_noauth_updateExactAnswerQuestion(input: {
                      itemId: "${questionInput.itemId}",
                      text: "${questionInput.text}",
                      caseSensitive: ${questionInput.caseSensitive},
                      correctAnswers: [
                        ${questionInput.correctAnswers.map(answer => `"${answer}"`)}
                      ],
                      feedback: "${questionInput.feedback}",
                      hint: "${questionInput.hint}"
                    }) {
                      itemId
                      text
                      caseSensitive
                      correctAnswers
                      feedback
                      hint
                    }
                  }`;
                  let assessmentId="assessmentId:"+_args.assessmentId;

                  let question = await context.QuizService.Mutation.mutateQuiz({
                      root,
                      args: {
                          assessmentId
                      },
                      selectionSet:selectionSetQuiz,
                      context,
                      info
                      });
  
  
                  return question._internal_noauth_updateExactAnswerQuestion;
  
            },

        },
        addNumericQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                              // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let oldItems= assessment.items;
                let items=assessment.items;
                items=[...items,_args.item];
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});

                let questionInput=_args.questionInput;
                questionInput.itemId= updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id)).id;
                let selectionSetQuiz= `{
                    _internal_noauth_addNumericQuestion(input: {
                      itemId: "${questionInput.itemId}",
                      number: ${questionInput.number},
                      text: "${questionInput.text}",
                      correctAnswer: ${questionInput.correctAnswer},
                      tolerance: ${questionInput.tolerance},
                      feedback: "${questionInput.feedback}",
                      hint: "${questionInput.hint}"
                    }) {
                      itemId
                      number
                      text
                      correctAnswer
                      tolerance
                      feedback
                      hint
                    }
                  }`;
                  let assessmentId="assessmentId:"+_args.assessmentId;

                  let question = await context.QuizService.Mutation.mutateQuiz({
                      root,
                      args: {
                          assessmentId
                      },
                      selectionSet:selectionSetQuiz,
                      context,
                      info
                      });
  

                 return question;

            },

        },
        updateNumericQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let items=assessment.items;
                items.map(item => item.id ===_args.item.id ? _args.item : item);
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
    
              
                let questionInput=_args.questionInput;
                let selectionSetQuiz= `{
                    _internal_noauth_updateNumericQuestion(input: {
                      itemId: "${questionInput.itemId}",
                      text: "${questionInput.text}",
                      correctAnswer: ${questionInput.correctAnswer},
                      tolerance: ${questionInput.tolerance},
                      feedback: "${questionInput.feedback}",
                      hint: "${questionInput.hint}"
                    }) {
                      itemId
                      text
                      correctAnswer
                      tolerance
                      feedback
                      hint
                    }
                  }`;
                  let assessmentId="assessmentId:"+_args.assessmentId;

                  let question = await context.QuizService.Mutation.mutateQuiz({
                      root,
                      args: {
                          assessmentId
                      },
                      selectionSet:selectionSetQuiz,
                      context,
                      info
                      });

                return question
            },

        },
        addSelfAssessmentQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                               // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
 
                let assessment =assessments[0];
                let oldItems= assessment.items;
                let items=assessment.items;
                items=[...items,_args.item];
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});

                let questionInput=_args.questionInput;
                questionInput.itemId= updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id)).id;
                let selectionSetQuiz= `{
                    _internal_noauth_addSelfAssessmentQuestion(input: {
                      itemId: "${questionInput.itemId}",
                      number: ${questionInput.number},
                      text: "${questionInput.text}",
                      solutionSuggestion: "${questionInput.solutionSuggestion}",
                      hint: "${questionInput.hint}"
                    }) {
                      itemId
                      number
                      text
                      solutionSuggestion
                      hint
                    }
                  }`;
                  let assessmentId="assessmentId:"+_args.assessmentId;

                  let question = await context.QuizService.Mutation.mutateQuiz({
                      root,
                      args: {
                          assessmentId
                      },
                      selectionSet:selectionSetQuiz,
                      context,
                      info
                      });
  ;

                 return question;
            },

        },
        updateSelfAssessmentQuestion: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let inputArray=[_args.assessmentId];
                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }
            
                let assessments = await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: inputArray,
                    },
                    selectionSet: `
                    {
                        metadata {
                            name
                            rewardPoints
                            suggestedDate
                            tagNames
                            chapterId
                       }
                             ... on QuizAssessment {
                                    assessmentMetadata {
                                          initialLearningInterval
                                          skillPoints
                                          skillTypes
                                    }
                                    items{
                                        id
                                        associatedSkills{id,skillName}
                                        associatedBloomLevels
                                    }
                             }
                            
                    }
                    `,
                    context,
                    info
                });
                let assessment =assessments[0];
                let items=assessment.items;
                items.map(item => item.id ===_args.item.id ? _args.item : item);
                assessment.items=items;
                let selectionSet=`{updateAssessment(input: {
                    metadata: {
                        name: "${assessment.metadata.name}",
                        suggestedDate: "${assessment.metadata.suggestedDate}",
                        chapterId: "${assessment.metadata.chapterId}",
                        rewardPoints: ${assessment.metadata.rewardPoints},
                        tagNames: [${assessment.metadata.tagNames.map(tag => `"${tag}"`)}]
                    },
                    assessmentMetadata: {
                        skillPoints: ${assessment.assessmentMetadata.skillPoints},
                        skillTypes: [${assessment.assessmentMetadata.skillTypes.map(skillType => `${skillType}`)}],
                        initialLearningInterval: ${assessment.assessmentMetadata.initialLearningInterval}
                    },
                    items:[
                        ${assessment.items.map(item => `{
                            ${item.id != null ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id != null ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
                            associatedBloomLevels:[${item.associatedBloomLevels.map(level => `${level}`)}]
                        }`)}
                    ]
                }) {
                    id
                    items{
                        id
                        associatedSkills{
                            skillName
                        }
                        associatedBloomLevels
                    }
                }
                }`;
                let updatedItems = await context.ContentService.Mutation.mutateContent({
                    root,
                    args:{contentId:_args.assessmentId},
                    selectionSet:selectionSet, 
                    context,
                    info});
    
              
                let questionInput=_args.questionInput;

                let selectionSetQuiz= `{
                    _internal_noauth_updateSelfAssessmentQuestion(input: {
                      itemId: "${questionInput.itemId}",
                      text: "${questionInput.text}",
                      solutionSuggestion: "${questionInput.solutionSuggestion}",
                      hint: "${questionInput.hint}"
                    }) {
                      itemId
                      text
                      solutionSuggestion
                      hint
                    }
                  }`;
                  let assessmentId="assessmentId:"+_args.assessmentId;

                  let question = await context.QuizService.Mutation.mutateQuiz({
                      root,
                      args: {
                          assessmentId
                      },
                      selectionSet:selectionSetQuiz,
                      context,
                      info
                      });

                return question
            },

        },
    }
};
export default resolvers;