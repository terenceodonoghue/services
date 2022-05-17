import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import { buildSchema, Field, ObjectType, Query, Resolver } from 'type-graphql';

@ObjectType()
class PAC {
  @Field()
  W: number;

  @Field()
  kW: number;
}

@ObjectType()
class Energy {
  @Field()
  Wh: number;

  @Field()
  kWh: number;
}

@ObjectType()
class SolarInverter {
  @Field()
  PAC: PAC;

  @Field()
  day: Energy;

  @Field()
  year: Energy;

  @Field()
  total: Energy;
}

@Resolver()
class SolarInverterResolver {
  @Query((returns) => Boolean)
  async solarInverter() {
    return true;
  }
}

async function bootstrap() {
  const PORT = process.env.PORT || 4000;

  const schema = await buildSchema({
    resolvers: [SolarInverterResolver],
  });

  // Create the GraphQL server
  const server = new ApolloServer({
    schema,
  });

  // Start the server
  const { url } = await server.listen(PORT);
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
