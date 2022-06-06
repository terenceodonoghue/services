import * as dotenv from 'dotenv-safe';
import 'reflect-metadata';
import { ApolloServer } from 'apollo-server';
import axios from 'axios';
import convert from '@terenceodonoghue/convert';
import {
  Arg,
  buildSchema,
  Field,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';

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

  @Field({ nullable: true })
  evRange?: number;

  @Field({ nullable: true })
  hotWater?: number;
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
  async solarInverter(
    @Arg('feedInTariff', { defaultValue: 0.0 }) feedInTariff: number,
  ): Promise<SolarInverter> {
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
        get kW() {
          return convert(PAC.Values[1], 'W').to('kW', 2);
        },
      },
      day: {
        Wh: DAY_ENERGY.Values[1],
        get kWh() {
          return convert(this.Wh, 'Wh').to('kWh', 2);
        },
        evRange: 0,
        hotWater: 0,
      },
      year: {
        Wh: YEAR_ENERGY.Values[1],
        get kWh() {
          return convert(this.Wh, 'Wh').to('kWh', 2);
        },
        evRange: 0,
        hotWater: 0,
      },
      total: {
        Wh: TOTAL_ENERGY.Values[1],
        get kWh() {
          return convert(this.Wh, 'Wh').to('kWh', 2);
        },
        evRange: 0,
        hotWater: 0,
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
