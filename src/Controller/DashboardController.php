<?php

namespace App\Controller;

use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    private Api $api;

    /**
     * @param \App\Service\Api $api
     */
    public function __construct(Api $api)
    {
        $this->api = $api;
    }

    /**
     * @Route("/home", name="home")
     */
    public function home(Request $request): Response
    {
        $token = $request->getSession()->get('token');

        $data = $this->api->user($token);

        if(!isset($data['data']) || !isset($data['data']['tips'])) {
            $games = [];
        } else {
            $games = $data['data']['tips'];
        }

        $table = $this->api->table($token);


        if(!isset($table['data']) || !isset($table['data']['users'])) {
            return $this->redirectToRoute('app_logout');
        }

        $users = $table['data']['users'];

      
        return $this->render('home/index.html.twig' ,[
            'games' => $games,
            'users' => $users,
        ]);
    }

    /**
     * @Route("/game", name="user_game")
     */
    public function gameTips(Request $request): Response
    {
        $data = '{
  "matchId": "2021-06-11:2100:TR-IT",
  "team1": "TR",
  "team2": "IT",
  "scoreTeam1": 0,
  "scoreTeam2": 3,
  "tips": [
    {
      "user": "theBest",
      "score": 1,
      "tipTeam1": 0,
      "tipTeam2": 2
    },
    {
      "user": "ninja",
      "score": 4,
      "tipTeam1": 0,
      "tipTeam2": 3
    },
    {
        "user": "rockstar",
      "score": 2,
      "tipTeam1": 1,
      "tipTeam2": 4
    }
  ]
}';

        $info = json_decode($data, true);

//        $token = $request->getSession()->get('token');
//        $data = $this->api->userTips($token, $username);
//
//        if(!isset($data['data'])) {
//            $data['data'] = [];
//        }

        dump($info);
        return $this->render('home/game.html.twig' ,[
            'data' => $info
        ]);
    }

    /**
     * @Route("/tips/{username}", name="user_past_tips")
     */
    public function userPastTips(Request $request, string $username): Response
    {
        $token = $request->getSession()->get('token');
        $data = $this->api->userTips($token, $username);

        if(!isset($data['data'])) {
            return $this->redirectToRoute('app_logout');
        }

        return $this->render('home/user-tips.html.twig' ,[
            'user' => $data['data'],
        ]);
    }

    /**
     * @Route("/table", name="table")
     */
    public function table(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $data = $this->api->table($token);

        if(!isset($data['data']) || !isset($data['data']['users'])) {
            return $this->redirectToRoute('app_logout');
        }

        return $this->render('home/table.html.twig' ,[
            'users' => $data['data']['users'],
        ]);
    }

    /**
     * @Route("/test", name="test")
     */
    public function test(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $conetnt = json_decode($request->getContent(), true);

        $conetnt['tipTeam1'] = (int)$conetnt['tipTeam1'];
        $conetnt['tipTeam2'] = (int)$conetnt['tipTeam2'];

        $data = $this->api->tips($token, $conetnt);
        $json = json_encode($data);

        return new Response($json);
    }
}
