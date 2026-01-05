import {Resolvers} from "../.mesh";

const resolvers: Resolvers = {
    Skill: {
        skillValue: {
            selectionSet: `
            {
                id
            }
            `,
            async resolve(root, _args, context, info) {
                return await context.SkilllevelService.Query._internal_noauth_skillValueBySkillId({
                    root,
                    args: { skillId: root.id },
                    context,
                    info,
                });
            }
        }
    }
}

export default resolvers;