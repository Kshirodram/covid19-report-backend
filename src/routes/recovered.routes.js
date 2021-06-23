import { default as Recovered } from "../models/recovered.model";

import { formatDate } from "../utils";

export default (app) => {
  app.get("/api/recovered", async (req, res) => {
    let data = [];
    const countryCode = req.query.country;
    const stateCode = req.query.state;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (countryCode && stateCode && startDate && endDate) {
      const query = [
        {
          $match: {
            countryCode: { $eq: countryCode },
            stateCode: { $eq: stateCode },
          },
        },
        {
          $project: {
            countryCode: 1,
            stateCode: 1,
            state: 1,
            country: 1,
            data: {
              $filter: {
                input: "$data",
                as: "item",
                cond: {
                  $and: [
                    {
                      $gte: ["$$item.date", startDate],
                    },
                    {
                      $lte: ["$$item.date", endDate],
                    },
                  ],
                },
              },
            },
          },
        },
      ];
      data = await Recovered.aggregate(query);
    } else if (countryCode && startDate && endDate) {
      const query = [
        {
          $match: {
            countryCode: { $eq: countryCode },
          },
        },
        {
          $project: {
            countryCode: 1,
            stateCode: 1,
            state: 1,
            country: 1,
            data: {
              $filter: {
                input: "$data",
                as: "item",
                cond: {
                  $and: [
                    {
                      $gte: ["$$item.date", startDate],
                    },
                    {
                      $lte: ["$$item.date", endDate],
                    },
                  ],
                },
              },
            },
          },
        },
      ];
      data = await Recovered.aggregate(query);
    } else if (startDate && endDate) {
      const query = {
        $project: {
          countryCode: 1,
          stateCode: 1,
          state: 1,
          country: 1,
          data: {
            $filter: {
              input: "$data",
              as: "item",
              cond: {
                $and: [
                  {
                    $gte: ["$$item.date", startDate],
                  },
                  {
                    $lte: ["$$item.date", endDate],
                  },
                ],
              },
            },
          },
        },
      };
      data = await Recovered.aggregate([query]);
    } else if (stateCode && countryCode) {
      data = await Recovered.find({
        stateCode,
        countryCode,
      });
    } else if (countryCode) {
      data = await Recovered.find({
        countryCode,
      });
    } else {
      // default to 7 days of data
      // current date we are taking as previous date
      // because data will be refresh every mid night for currrent date
      data = await Recovered.aggregate([
        {
          $project: {
            country: 1,
            countryCode: 1,
            state: 1,
            stateCode: 1,
            data: {
              $filter: {
                input: "$data",
                as: "item",
                cond: {
                  $and: [
                    {
                      $gte: [
                        "$$item.date",
                        formatDate(
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ),
                      ],
                    },
                    {
                      $lte: [
                        "$$item.date",
                        formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ]);
    }
    res.send(data);
  });
};
