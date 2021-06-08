<?php

namespace App\Controller;

use App\Security\User;
use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class UserController extends AbstractController
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
     * @Route("/register", name="user_register")
     */
    public function register(Request $request): Response
    {
        $user = new User();

        $error = '';
        if ($request->isMethod('POST')) {

            $user->setUsername($request->request->get('username'));
            $user->setPassword($request->request->get('password'));
            $user->setEmail($request->request->get('email'));

            $content = $this->api->register($user);
            if ($content['success'] === true) {
                $this->addFlash('success', 'Benutzer registriert');
                return $this->redirectToRoute('app_login');
            } else {
                $this->addFlash('error', $content['message']);
            }
        }

        return $this->render('user/register.html.twig', [
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
        ]);
    }
}
