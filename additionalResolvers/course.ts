import {Resolvers} from "../.mesh";

const resolvers: Resolvers = {
    Course: {
        // combines suggestions from the chapters of the course to a single list of suggestions for the
        // whole course
        suggestions: {
            // TODO use course service filters instead of manually filtering the chapters
            // manually request some fields from the chapters that we will need to decide if
            // the chapter should be included in the suggestions
            selectionSet: `
            {
              chapters {
                elements {
                  id
                  startDate
                }
              }
            }
            `,
            async resolve(root, _args, context, info) {
                let currentTime = Date.now();

                let chapters = root.chapters.elements.filter(chapter => {
                    // if chapter hasn't started yet, don't suggest it
                    return Date.parse(chapter.startDate) <= currentTime;

                });

                return await context.ContentService.Query.suggestionsByChapterIds({
                    root,
                    args: {
                        chapterIds: chapters.map(chapter => chapter.id),
                        amount: _args.amount,
                        skillTypes: _args.skillTypes
                    },
					context,
					info
                })
            }
        },

        userProgress: {
            selectionSet: `
            {
              chapters {
                elements {
                  id
                }
              }
            }`,

            async resolve(root, _args, context, info) {
                const chapterIds: string[] = root.chapters.elements.map(chapter => chapter.id);

                const queryParameters = {
                    root,
                    args: {
                        chapterIds: chapterIds
                    },
                    selectionSet: `
                    {
                        completedContents
                        totalContents
                        progress
                    }`,
                    context,
                    info
                };

                const progressOfChapters: CompositeProgressInformation[]
                    = await context.ContentService.Query._internal_noauth_progressByChapterIds(queryParameters);

                return combineChapterProgressInformation(progressOfChapters);
            }
        },

        skills: {
            selectionSet: `
            {
              numberOfCourseMemberships
            }`,

            async resolve(root, _args, context, info) {
                const skills = await context.ContentService.Query._internal_noauth_achievableSkillsByCourseIds({
                    root,
                    args: { courseIds: [root.id] },
                    selectionSet: `
                    {
                        id
                        skillName
                        skillCategory
                        isCustomSkill
                    }`,
                    context,
                    info,
                });

                const courseSkills = skills[0];

                if (!courseSkills || courseSkills.length === 0) {
                    return [];
                }

                const skillIds = courseSkills.map(s => s.id);

                const skillValues = await context.SkilllevelService.Query._internal_noauth_skillValuesBySkillIds({
                    root,
                    args: { skillIds },
                    selectionSet: `
                    {
                        skillId
                        skillValue
                    }`,
                    context,
                    info,
                });

                const skillAllUsersStats = await context.SkilllevelService.Query._internal_noauth_skillsAllUsersStatsBySkillIds({
                    root,
                    args: { skillIds },
                    selectionSet: `
                    {
                        skillId
                        skillValueSum
                        participantCount
                    }`,
                    context,
                    info,
                });

                const skillValueById = new Map<string, number>();
                skillValues.forEach((value) => skillValueById.set(value.skillId, value.skillValue));

                const skillAllUsersStatsById = new Map<string, {skillValueSum: number; participantCount: number}>();
                skillAllUsersStats.forEach(stat => {
                    skillAllUsersStatsById.set(stat.skillId, {
                        skillValueSum: stat.skillValueSum,
                        participantCount: stat.participantCount,
                    });
                });

                type SkillValueAggregate = {
                    skillValueSum: number;
                    allUserSkillValueSum: number;
                    sameSkillCount: number;
                    maxParticipantCount: number;
                };

                const skillValueAggregate = new Map<string, SkillValueAggregate>();

                courseSkills.forEach(skill => {
                    const currentValue = skillValueById.get(skill.id) ?? 0;
                    const currentAllUserValue = skillAllUsersStatsById.get(skill.id)?.skillValueSum ?? 0;
                    const currentParticipantCount = skillAllUsersStatsById.get(skill.id)?.participantCount ?? 0;
                    const currentKey = `${skill.skillName}_${skill.skillCategory}`;

                    const current = skillValueAggregate.get(currentKey) ?? { skillValueSum: 0, sameSkillCount: 0, allUserSkillValueSum: 0, maxParticipantCount: 0};

                    current.skillValueSum += currentValue;
                    current.allUserSkillValueSum += currentAllUserValue;
                    current.sameSkillCount += 1;
                    current.maxParticipantCount =  Math.max(current.maxParticipantCount, currentParticipantCount);

                    skillValueAggregate.set(currentKey, current);
                });

                return courseSkills.map(skill => {
                    const key = `${skill.skillName}_${skill.skillCategory}`;
                    const valueAggregate = skillValueAggregate.get(key);

                    return {
                        id: skill.id,
                        skillName: skill.skillName,
                        skillCategory: skill.skillCategory,
                        isCustomSkill: skill.isCustomSkill,
                        skillValue:
                            valueAggregate && valueAggregate.sameSkillCount > 0
                                ? valueAggregate.skillValueSum / valueAggregate.sameSkillCount
                                : 0,
                        skillAllUsersStats: {
                            skillId: skill.id,
                            skillValueSum: skillAllUsersStatsById.get(skill.id)?.skillValueSum ?? 0,
                            participantCount: valueAggregate?.maxParticipantCount ?? 0,
                            averageSkillValue:
                                valueAggregate &&
                                valueAggregate.sameSkillCount > 0 &&
                                root.numberOfCourseMemberships > 0
                                    ? valueAggregate.allUserSkillValueSum /
                                    (valueAggregate.sameSkillCount * root.numberOfCourseMemberships)
                                    : 0
                        }
                    };
                });
            },
        },

    },
    Mutation: {
        createSection: {
            async resolve(root, _args, context, info) {
                let chapters = await context.CourseService.Query._internal_noauth_chaptersByIds({
                    root,
                    args: {
                        ids: [_args.input.chapterId]
                    },
                    selectionSet: `
                    {
                        course {
                            id
                        }
                    }
                    `,
                });

                if (chapters.length !== 1) {
                    throw new Error("Chapter with given id does not exist.");
                }

                let courseId = chapters[0].course.id;

                return await context.ContentService.Mutation._internal_createSection({
                    root,
                    args: {
                        courseId: courseId,
                        input: _args.input
                    },
                    context,
                    info
                });
            }
        }
    }
};

/**
 * Sums up the progress information of all chapters of a course.
 */
function combineChapterProgressInformation(progressPerChapter: CompositeProgressInformation[]): CompositeProgressInformation {
    let totalCompletedContents: number = 0;
    let totalContents: number = 0;

    progressPerChapter.forEach(progressInformation => {
        totalCompletedContents += progressInformation.completedContents;
        totalContents += progressInformation.totalContents;
    });

    let progress = 100.0;

    if (totalContents !== 0) {
        progress = totalCompletedContents / totalContents * 100.0;
    }

    return {
        completedContents: totalCompletedContents,
        totalContents: totalContents,
        progress: progress
    }
}

type CompositeProgressInformation = {
    completedContents: number,
    totalContents: number
    progress: number
}

export default resolvers;