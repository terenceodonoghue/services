import * as dotenv from 'dotenv-safe';
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import axios from 'axios';
import { buildSchema, Field, ObjectType, Query, Resolver } from 'type-graphql';

dotenv.config();

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

const instance = axios.create({
  baseURL: process.env.SOLAR_INVERTER_API_URL,
  params: {
    Scope: 'System',
  },
  timeout: 1000,
});

interface Measurable {
  Unit: string;
  Values: {
    1: number;
  };
}

interface Response {
  Body: {
    Data: {
      PAC: Measurable;
      DAY_ENERGY: Measurable;
      YEAR_ENERGY: Measurable;
      TOTAL_ENERGY: Measurable;
    };
  };
}

@Resolver()
class SolarInverterResolver {
  @Query((returns) => SolarInverter)
  async solarInverter(): Promise<SolarInverter> {
    const {
      data: {
        Body: {
          Data: { PAC, DAY_ENERGY, YEAR_ENERGY, TOTAL_ENERGY },
        },
      },
    } = await instance.get<Response>('/GetInverterRealtimeData.cgi');

    return {
      PAC: {
        W: PAC.Values[1],
        kW: Number.parseFloat((PAC.Values[1] / 1000).toFixed(2)),
      },
      day: {
        Wh: DAY_ENERGY.Values[1],
        kWh: Number.parseFloat((DAY_ENERGY.Values[1] / 1000).toFixed(2)),
      },
      year: {
        Wh: YEAR_ENERGY.Values[1],
        kWh: Number.parseFloat((YEAR_ENERGY.Values[1] / 1000).toFixed(2)),
      },
      total: {
        Wh: TOTAL_ENERGY.Values[1],
        kWh: Number.parseFloat((TOTAL_ENERGY.Values[1] / 1000).toFixed(2)),
      },
    };
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
