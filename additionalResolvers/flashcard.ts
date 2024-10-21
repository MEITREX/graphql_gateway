import { Resolvers } from "../.mesh";

const resolvers: Resolvers = {

    FlashcardSetMutation: {

        updateFlashcard: {
            async resolve(root, _args, context, info) {
                let inputArray = [_args.assessmentId];
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
                             ... on FlashcardSetAssessment {
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
                let assessment = assessments[0];
                let items = assessment.items;
                items.map(item => item.id == _args.item.id ? _args.item : item);
                for (let i = 0; i < items.length; i++) {
                    if (_args.item.id == items[i].id) {
                        items[i] = _args.item
                    }
                }
                assessment.items = items;
                let selectionSet = `{updateAssessment(input: {
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
                            ${item.id ? `id:"${item.id}",` : ''}
                            associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
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
                    args: { contentId: _args.assessmentId },
                    selectionSet: selectionSet,
                    context,
                    info
                });

                let flashcardInput = _args.flashcardInput;
                let selectionSetFlashcard = `{_internal_noauth_updateFlashcard(input: {
                    itemId: "${flashcardInput.itemId}",
                    sides: [
                        ${flashcardInput.sides.map(side => `{
                            label: "${side.label}",
                            isQuestion: ${side.isQuestion},
                            isAnswer: ${side.isAnswer},
                            text: "${side.text}"}`)}
                    ]
                }){                    
                        itemId
                        sides{
                            label
                            isQuestion
                            isAnswer
                            text
                        }
                    }
                }`;
                let flashcard = await context.FlashcardService.Mutation.mutateFlashcardSet({
                    root,
                    args: {
                        assessmentId: _args.assessmentId
                    },
                    // we need to define a selection set manually here, otherwise it thinks we don't need any data
                    // from this mutation and it won't actually be executed
                    selectionSet: selectionSetFlashcard,
                    context,
                    info
                });
                let returnItem = updatedItems.updateAssessment.items.find(item => item.id == _args.item.id);
                let flashcardOutput = {
                    flashcard: flashcard._internal_noauth_updateFlashcard,
                    item: returnItem
                }; // Initialize the variable

                return flashcardOutput;
            },

        },
        createFlashcard: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let inputArray = [_args.assessmentId];
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
                             ... on FlashcardSetAssessment {
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
                let assessment = assessments[0];
                let oldItems = assessment.items;
                let items = assessment.items;
                items = [...items, _args.item];
                assessment.items = items;
                let selectionSet = `{updateAssessment(input: {
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
                        ${item.id ? `id:"${item.id}",` : ''}
                        associatedSkills:[${item.associatedSkills.map(skill => `{ ${skill.id ? `id:"${skill.id}",` : ''} skillName:"${skill.skillName}"}`)}],
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
                    args: { contentId: _args.assessmentId },
                    selectionSet: selectionSet,
                    context,
                    info
                });

                let flashcardInput = _args.flashcardInput;
                for (let item of updatedItems.updateAssessment.items) {
                    if (!oldItems.some(oldItem => oldItem.id === item.id)) {
                        flashcardInput.itemId = item.id;
                        break;
                    }
                }
                flashcardInput.itemId = updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id)).id;
                let selectionSetFlashcard = `{_internal_noauth_createFlashcard(input: {
                itemId: "${flashcardInput.itemId}",
                sides: [
                    ${flashcardInput.sides.map(side => `{
                        label: "${side.label}",
                        isQuestion: ${side.isQuestion},
                        isAnswer: ${side.isAnswer},
                        text: "${side.text}"}`)}
                ]
            }){
                    itemId
                    sides{
                        label
                        isQuestion
                        isAnswer
                        text
                    }
                }
            }`;
                let flashcard = await context.FlashcardService.Mutation.mutateFlashcardSet({
                    root,
                    args: {
                        assessmentId: _args.assessmentId
                    },
                    selectionSet: selectionSetFlashcard,
                    context,
                    info
                });
                let returnItem;
                returnItem = updatedItems.updateAssessment.items.find(item => !oldItems.some(oldItem => oldItem.id === item.id));
                let flashcardOutput = {
                    flashcard: flashcard._internal_noauth_createFlashcard,
                    item: returnItem
                }; // Initialize the variable
                return flashcardOutput;
            },

        },
    }
};
export default resolvers;